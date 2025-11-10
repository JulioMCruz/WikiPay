#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::string::String;
use stylus_sdk::{
    alloy_primitives::{Address, FixedBytes, U256},
    block, msg,
    prelude::*,
};

sol_storage! {
    #[entrypoint]
    pub struct WikiPayX402 {
        // Article storage
        mapping(uint256 => string) ipfs_hashes;
        mapping(uint256 => string) previews;
        mapping(uint256 => uint256) prices;          // USDC amount (6 decimals)
        mapping(uint256 => address) creators;
        mapping(uint256 => uint256) unlocks;
        mapping(uint256 => uint256) timestamps;

        // Nullifier tracking (prevents double-spend)
        mapping(bytes32 => bool) nullifiers_used;

        // Total articles
        uint256 article_count;

        // USDC contract address (Circle USDC on Arbitrum One)
        address usdc_address;
    }
}

#[public]
impl WikiPayX402 {
    /// Get USDC address
    pub fn get_usdc_address(&self) -> Address {
        self.usdc_address.get()
    }

    /// Get total articles count
    pub fn get_total_articles(&self) -> U256 {
        self.article_count.get()
    }

    /// Publish article (stores metadata on-chain, content on IPFS)
    /// @param ipfs_hash IPFS CID pointing to encrypted content
    /// @param preview Public preview text
    /// @param price USDC amount (6 decimals, e.g., 10000 = $0.01)
    pub fn publish_article(
        &mut self,
        ipfs_hash: String,
        preview: String,
        price: U256,
    ) -> U256 {
        let article_id = self.article_count.get();
        let creator = msg::sender();
        let timestamp = U256::from(block::timestamp());

        // Store article data
        self.ipfs_hashes.setter(article_id).set_str(&ipfs_hash);
        self.previews.setter(article_id).set_str(&preview);
        self.prices.setter(article_id).set(price);
        self.creators.setter(article_id).set(creator);
        self.unlocks.setter(article_id).set(U256::from(0));
        self.timestamps.setter(article_id).set(timestamp);

        // Increment count
        self.article_count.set(article_id + U256::from(1));

        article_id
    }

    /// Get article data
    /// Returns: (ipfsHash, preview, price, creator, unlocks, timestamp)
    pub fn get_article(&self, article_id: U256) -> (String, String, U256, Address, U256, U256) {
        let ipfs_hash = self.ipfs_hashes.getter(article_id).get_string();
        let preview = self.previews.getter(article_id).get_string();
        let price = self.prices.get(article_id);
        let creator = self.creators.get(article_id);
        let unlocks = self.unlocks.get(article_id);
        let timestamp = self.timestamps.get(article_id);

        (ipfs_hash, preview, price, creator, unlocks, timestamp)
    }

    /// Check if nullifier is already used
    pub fn nullifiers_used(&self, nullifier: FixedBytes<32>) -> bool {
        self.nullifiers_used.get(nullifier)
    }

    /// Unlock article using x402 protocol
    /// Note: USDC transfer is handled by the facilitator off-chain
    /// This function only records the unlock on-chain
    /// @param article_id Article to unlock
    /// @param nullifier Zero-knowledge nullifier (prevents double-spend)
    /// @param proof Zero-knowledge proof
    /// @param from User's address
    /// @param validAfter EIP-3009 validAfter timestamp (for reference)
    /// @param validBefore EIP-3009 validBefore timestamp (for reference)
    /// @param nonce EIP-3009 nonce (should match nullifier)
    /// @param v Signature component
    /// @param r Signature component
    /// @param s Signature component
    pub fn unlock_article_x402(
        &mut self,
        article_id: U256,
        nullifier: FixedBytes<32>,
        proof: FixedBytes<32>,
        from: Address,
        valid_after: U256,
        valid_before: U256,
        nonce: FixedBytes<32>,
        v: u8,
        r: FixedBytes<32>,
        s: FixedBytes<32>,
    ) -> bool {
        // Verify nullifier not already used
        assert!(!self.nullifiers_used.get(nullifier), "Nullifier already used");

        // Get article data
        let price = self.prices.get(article_id);

        assert!(price > U256::ZERO, "Article does not exist");

        // Verify proof is not zero (basic validation)
        assert!(!proof.is_zero(), "Invalid proof");

        // Mark nullifier as used
        self.nullifiers_used.setter(nullifier).set(true);

        // Increment unlock count
        let current_unlocks = self.unlocks.get(article_id);
        self.unlocks.setter(article_id).set(current_unlocks + U256::from(1));

        // Note: USDC transfer is handled by facilitator who calls this function
        // The facilitator has already executed transferWithAuthorization on USDC contract
        // before calling this function

        true
    }
}
