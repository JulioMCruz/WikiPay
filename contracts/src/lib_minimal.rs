#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::string::String;
use stylus_sdk::{alloy_primitives::U256, prelude::*};

sol_storage! {
    #[entrypoint]
    pub struct WikiPayContract {
        uint256 next_article_id;
        mapping(uint256 => string) ipfs_hashes;
        mapping(uint256 => string) previews;
        mapping(uint256 => uint256) prices;
    }
}

#[public]
impl WikiPayContract {
    // View function - just like the working example
    pub fn get_total_articles(&self) -> U256 {
        self.next_article_id.get()
    }

    // Publish article - simplified
    pub fn publish_article(&mut self, preview: String, ipfs_hash: String, price: U256) -> U256 {
        let article_id = self.next_article_id.get();

        // Store data
        self.previews.setter(article_id).set_str(&preview);
        self.ipfs_hashes.setter(article_id).set_str(&ipfs_hash);
        self.prices.setter(article_id).set(price);

        // Increment counter
        self.next_article_id.set(article_id + U256::from(1));

        article_id
    }

    // Get IPFS hash
    pub fn get_ipfs_hash(&self, article_id: U256) -> String {
        self.ipfs_hashes.get(article_id).get_string()
    }
}
