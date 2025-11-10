#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, FixedBytes, U256},
    prelude::*,
};

sol_storage! {
    #[entrypoint]
    pub struct WikiPayContract {
        // Article data stored separately for Stylus compatibility
        mapping(uint256 => address) article_creators;
        mapping(uint256 => uint256) article_prices;
        mapping(uint256 => uint256) article_unlocks;

        // Mapping: article_id => preview text (first 200 words)
        mapping(uint256 => string) previews;

        // Mapping: article_id => IPFS hash (CID) pointing to encrypted content
        // IPFS hash is ~46 bytes vs 3KB+ for full content (99.7% gas savings)
        mapping(uint256 => string) ipfs_hashes;

        // Mapping: nullifier => used (prevents double-spend)
        mapping(bytes32 => bool) nullifiers_used;

        // Mapping: creator => earnings
        mapping(address => uint256) creator_earnings;

        // Next article ID
        uint256 next_article_id;
    }
}

#[public]
impl WikiPayContract {
    /// Publish a new article
    /// @param preview First 200 words (public)
    /// @param ipfs_hash IPFS CID pointing to encrypted full content (Qm... or bafy...)
    /// @param price Payment required to unlock (in wei)
    pub fn publish_article(
        &mut self,
        preview: String,
        ipfs_hash: String,
        price: U256,
    ) -> U256 {
        // Validate IPFS hash format (CIDv0: Qm..., CIDv1: baf...)
        assert!(
            ipfs_hash.starts_with("Qm") || ipfs_hash.starts_with("baf"),
            "Invalid IPFS hash format"
        );
        assert!(
            ipfs_hash.len() >= 46 && ipfs_hash.len() <= 64,
            "Invalid IPFS hash length"
        );

        // Validate price between 0.01 and 0.10 ETH
        let min_price = U256::from(10_000_000_000_000_000u64); // 0.01 ETH
        let max_price = U256::from(100_000_000_000_000_000u64); // 0.10 ETH

        assert!(price >= min_price && price <= max_price, "Price must be between 0.01 and 0.10 ETH");

        let article_id = self.next_article_id.get();
        let creator = self.vm().msg_sender();

        // Store article data
        self.article_creators.setter(article_id).set(creator);
        self.article_prices.setter(article_id).set(price);
        self.article_unlocks.setter(article_id).set(U256::from(0));

        // Store preview and IPFS hash (NOT full content - saves 99.7% gas)
        self.previews.setter(article_id).set_str(&preview);
        self.ipfs_hashes.setter(article_id).set_str(&ipfs_hash);

        // Increment next article ID
        self.next_article_id.set(article_id + U256::from(1));

        article_id
    }

    /// Unlock article anonymously using ZK proof
    /// @param article_id Article to unlock
    /// @param nullifier Unique nullifier (prevents double-spend)
    /// @param proof ZK proof bytes
    #[payable]
    pub fn unlock_article_anonymous(
        &mut self,
        article_id: U256,
        nullifier: FixedBytes<32>,
        proof: FixedBytes<32>,
    ) -> bool {
        // Check nullifier not already used
        assert!(!self.nullifiers_used.get(nullifier), "Nullifier already used");

        // Get article data
        let creator = self.article_creators.get(article_id);
        let price = self.article_prices.get(article_id);

        // Validate article exists
        assert!(creator != Address::ZERO, "Article not found");

        // Get the payment value sent with the transaction
        let payment = self.vm().msg_value();

        // Check payment sent
        assert!(payment >= price, "Insufficient payment");

        // Verify ZK proof (simplified for MVP)
        // Note: proof is now FixedBytes<32> for better ABI compatibility
        assert!(!proof.is_zero(), "Invalid ZK proof");

        // Mark nullifier as used
        self.nullifiers_used.setter(nullifier).set(true);

        // Add payment to creator earnings (use actual payment amount, not price)
        let current_earnings = self.creator_earnings.get(creator);
        self.creator_earnings.setter(creator).set(current_earnings + payment);

        // Increment unlock count
        let unlocks = self.article_unlocks.get(article_id);
        self.article_unlocks.setter(article_id).set(unlocks + U256::from(1));

        // Return success (frontend reads encrypted content separately)
        true
    }

    /// Withdraw creator earnings
    pub fn withdraw_earnings(&mut self) -> U256 {
        let creator = self.vm().msg_sender();
        let earnings = self.creator_earnings.get(creator);

        assert!(earnings != U256::ZERO, "No earnings to withdraw");

        // Reset earnings before transfer (reentrancy protection)
        self.creator_earnings.setter(creator).set(U256::ZERO);

        // Transfer earnings to creator
        if self.vm().transfer_eth(creator, earnings).is_err() {
            // Restore earnings on failure
            self.creator_earnings.setter(creator).set(earnings);
            panic!("Transfer failed");
        }

        earnings
    }

    // === View Functions ===

    /// Get article details
    pub fn get_article(&self, article_id: U256) -> (Address, U256, U256, String) {
        let creator = self.article_creators.get(article_id);
        assert!(creator != Address::ZERO, "Article not found");

        let price = self.article_prices.get(article_id);
        let unlocks = self.article_unlocks.get(article_id);
        let preview = self.previews.get(article_id).get_string();

        (creator, price, unlocks, preview)
    }

    /// Get creator earnings
    pub fn get_creator_earnings(&self, creator: Address) -> U256 {
        self.creator_earnings.get(creator)
    }

    /// Check if nullifier used
    pub fn is_nullifier_used(&self, nullifier: FixedBytes<32>) -> bool {
        self.nullifiers_used.get(nullifier)
    }

    /// Get total articles published
    pub fn get_total_articles(&self) -> U256 {
        // Safe getter that handles uninitialized storage (defaults to 0)
        let id = self.next_article_id.get();
        id
    }

    /// Get IPFS hash for an article
    /// Use this hash to fetch encrypted content from IPFS/Pinata
    /// Note: Content is decrypted client-side after unlocking
    pub fn get_ipfs_hash(&self, article_id: U256) -> String {
        self.ipfs_hashes.get(article_id).get_string()
    }
}

// Internal functions (not exposed via ABI)
impl WikiPayContract {
    /// Verify ZK payment proof (simplified for MVP)
    /// In production: Full Plonky2 proof verification
    fn verify_payment_proof(
        &self,
        proof: &Vec<u8>,
        _article_id: U256,
        _nullifier: FixedBytes<32>,
    ) -> bool {
        // MVP: Basic proof structure validation
        if proof.len() < 32 {
            return false;
        }

        // TODO: Implement full Plonky2 verification
        // For now, accept any proof with correct structure
        true
    }
}
