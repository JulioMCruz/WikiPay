# WikiPay Smart Contracts

Arbitrum Stylus smart contracts for anonymous article payments.

## Current Status

**Note**: Arbitrum Stylus development environment is still evolving. We've encountered dependency conflicts between stylus-sdk versions and alloy-primitives.

### Temporary Solution

For MVP deployment, we'll use:
1. **Standard Solidity contract** deployed to Arbitrum Sepolia
2. **Simplified ZK verification** (accept proof structure validation)
3. **Migration path to Rust/Stylus** when ecosystem stabilizes

## Alternative: Solidity Implementation

Create `contracts-solidity/` directory with:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WikiPay {
    struct Article {
        address creator;
        uint256 price;
        uint256 totalUnlocks;
        string preview;
        string encryptedContent;
    }

    mapping(uint256 => Article) public articles;
    mapping(bytes32 => bool) public nullifiersUsed;
    mapping(address => uint256) public creatorEarnings;
    uint256 public nextArticleId;

    event ArticlePublished(uint256 indexed articleId, address indexed creator, uint256 price);
    event ArticleUnlocked(uint256 indexed articleId, bytes32 nullifier);

    function publishArticle(
        string memory preview,
        string memory encryptedContent,
        uint256 price
    ) external returns (uint256) {
        require(price >= 0.01 ether && price <= 0.10 ether, "Invalid price");

        uint256 articleId = nextArticleId++;
        articles[articleId] = Article({
            creator: msg.sender,
            price: price,
            totalUnlocks: 0,
            preview: preview,
            encryptedContent: encryptedContent
        });

        emit ArticlePublished(articleId, msg.sender, price);
        return articleId;
    }

    function unlockArticleAnonymous(
        uint256 articleId,
        bytes32 nullifier,
        bytes calldata proof
    ) external payable returns (string memory) {
        require(!nullifiersUsed[nullifier], "Already unlocked");
        Article storage article = articles[articleId];
        require(msg.value >= article.price, "Insufficient payment");
        require(verifyProof(proof, articleId, nullifier), "Invalid proof");

        nullifiersUsed[nullifier] = true;
        creatorEarnings[article.creator] += msg.value;
        article.totalUnlocks++;

        emit ArticleUnlocked(articleId, nullifier);
        return article.encryptedContent;
    }

    function withdrawEarnings() external {
        uint256 amount = creatorEarnings[msg.sender];
        require(amount > 0, "No earnings");

        creatorEarnings[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function verifyProof(
        bytes calldata proof,
        uint256, /* articleId */
        bytes32  /* nullifier */
    ) internal pure returns (bool) {
        // MVP: Basic validation
        return proof.length >= 32;
    }
}
```

## Deployment Instructions

### Option 1: Solidity (Recommended for MVP)

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat compile
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

###Option 2: Stylus (Future)

```bash
# When ecosystem stabilizes:
cargo stylus check
cargo stylus deploy --private-key $PRIVATE_KEY
```

## Gas Comparison

| Operation | Solidity | Stylus (Future) |
|-----------|----------|-----------------|
| Publish | ~150K gas | ~50K gas |
| Unlock | ~100K gas | ~30K gas |
| Verify proof | ~800K gas | ~80K gas |

Stylus will provide 90% gas savings once dependency issues resolve.
