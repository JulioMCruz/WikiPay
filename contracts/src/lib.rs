#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

#[global_allocator]
static ALLOC: mini_alloc::MiniAlloc = mini_alloc::MiniAlloc::INIT;

use stylus_sdk::{
    alloy_primitives::{Address, FixedBytes, U256},
    alloy_sol_types::sol,
    evm, msg, call,
    prelude::*,
};
use alloc::string::String;
use alloc::vec::Vec;

// Article structure
sol! {
    event ArticlePublished(uint256 indexed articleId, address indexed creator, uint256 price);
    event ArticleUnlocked(uint256 indexed articleId, bytes32 nullifier);
    event EarningsWithdrawn(address indexed creator, uint256 amount);
}

#[derive(Clone, Copy)]
pub struct Article {
    pub creator: Address,
    pub price: U256,
    pub total_unlocks: U256,
}

sol_storage! {
    #[entrypoint]
    pub struct WikiPayContract {
        // Mapping: article_id => Article
        mapping(uint256 => Article) articles;

        // Mapping: article_id => preview text (first 200 words)
        mapping(uint256 => string) previews;

        // Mapping: article_id => encrypted full content
        mapping(uint256 => string) encrypted_content;

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
    /// @param encrypted_content Full article encrypted
    /// @param price Payment required to unlock (in wei)
    pub fn publish_article(
        &mut self,
        preview: String,
        encrypted_content: String,
        price: U256,
    ) -> Result<U256, Vec<u8>> {
        // Validate price between 0.01 and 0.10 ETH
        let min_price = U256::from(10_000_000_000_000_000u64); // 0.01 ETH
        let max_price = U256::from(100_000_000_000_000_000u64); // 0.10 ETH

        if price < min_price || price > max_price {
            return Err(b"Price must be between 0.01 and 0.10 ETH".to_vec());
        }

        let article_id = self.next_article_id.get();
        let creator = msg::sender();

        // Create article
        let mut article = self.articles.setter(article_id);
        article.creator.set(creator);
        article.price.set(price);
        article.total_unlocks.set(U256::from(0));

        // Store preview and content
        self.previews.setter(article_id).set_str(&preview);
        self.encrypted_content.setter(article_id).set_str(&encrypted_content);

        // Increment next article ID
        self.next_article_id.set(article_id + U256::from(1));

        // Emit event
        evm::log(ArticlePublished {
            articleId: article_id,
            creator,
            price,
        });

        Ok(article_id)
    }

    /// Unlock article anonymously using ZK proof
    /// @param article_id Article to unlock
    /// @param nullifier Unique nullifier (prevents double-spend)
    /// @param proof ZK proof bytes
    pub fn unlock_article_anonymous(
        &mut self,
        article_id: U256,
        nullifier: FixedBytes<32>,
        proof: Vec<u8>,
    ) -> Result<String, Vec<u8>> {
        // Check nullifier not already used
        if self.nullifiers_used.get(nullifier) {
            return Err(b"Nullifier already used (article already unlocked)".to_vec());
        }

        // Get article
        let article = self.articles.get(article_id);
        let creator = article.creator;
        let price = article.price;

        // Check payment sent
        if msg::value() < price {
            return Err(b"Insufficient payment".to_vec());
        }

        // Verify ZK proof (simplified for MVP)
        // In production: Full Plonky2 verification
        if !self.verify_payment_proof(&proof, article_id, nullifier) {
            return Err(b"Invalid ZK proof".to_vec());
        }

        // Mark nullifier as used
        self.nullifiers_used.setter(nullifier).set(true);

        // Add payment to creator earnings
        let current_earnings = self.creator_earnings.get(creator);
        self.creator_earnings.setter(creator).set(current_earnings + price);

        // Increment unlock count
        let mut article_mut = self.articles.setter(article_id);
        let unlocks = article.total_unlocks;
        article_mut.total_unlocks.set(unlocks + U256::from(1));

        // Emit event
        evm::log(ArticleUnlocked {
            articleId: article_id,
            nullifier,
        });

        // Return encrypted content (frontend decrypts)
        Ok(self.encrypted_content.get(article_id).get_string())
    }

    /// Withdraw creator earnings
    pub fn withdraw_earnings(&mut self) -> Result<U256, Vec<u8>> {
        let creator = msg::sender();
        let earnings = self.creator_earnings.get(creator);

        if earnings == U256::ZERO {
            return Err(b"No earnings to withdraw".to_vec());
        }

        // Reset earnings before transfer (reentrancy protection)
        self.creator_earnings.setter(creator).set(U256::ZERO);

        // Transfer earnings to creator
        if let Err(_) = call::transfer_eth(creator, earnings) {
            // Restore earnings on failure
            self.creator_earnings.setter(creator).set(earnings);
            return Err(b"Transfer failed".to_vec());
        }

        // Emit event
        evm::log(EarningsWithdrawn { creator, amount: earnings });

        Ok(earnings)
    }

    // === View Functions ===

    /// Get article details
    pub fn get_article(&self, article_id: U256) -> Result<(Address, U256, U256, String), Vec<u8>> {
        let article = self.articles.get(article_id);
        let preview = self.previews.get(article_id).get_string();

        Ok((
            article.creator,
            article.price,
            article.total_unlocks,
            preview,
        ))
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
        self.next_article_id.get()
    }

    // === Internal Functions ===

    /// Verify ZK payment proof (simplified for MVP)
    /// In production: Full Plonky2 proof verification
    fn verify_payment_proof(
        &self,
        proof: &[u8],
        _article_id: U256,
        _nullifier: FixedBytes<32>,
    ) -> bool {
        // MVP: Basic proof structure validation
        // Minimum proof size (placeholder)
        if proof.len() < 32 {
            return false;
        }

        // TODO: Implement full Plonky2 verification
        // For now, accept any proof with correct structure
        true
    }
}
