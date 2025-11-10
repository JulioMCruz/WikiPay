#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::{string::String, vec::Vec};
use stylus_sdk::{alloy_primitives::U256, prelude::*};

// WikiPay - Minimal on-chain storage, everything else in IPFS
sol_storage! {
    #[entrypoint]
    pub struct WikiPay {
        uint256 article_count;
    }
}

#[public]
impl WikiPay {
    /// Get total articles count
    pub fn get_total_articles(&self) -> U256 {
        self.article_count.get()
    }

    /// Publish article - only stores count, frontend handles IPFS
    /// Returns article ID that frontend uses to store/retrieve from IPFS
    pub fn publish_article(&mut self, ipfs_hash: String) -> U256 {
        let article_id = self.article_count.get();
        self.article_count.set(article_id + U256::from(1));
        article_id
    }
}
