// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WikiPayX402
 * @notice Anonymous content payment system using x402 protocol
 * @dev Stores article metadata on-chain, content on IPFS
 */
contract WikiPayX402 {
    // Article structure
    struct Article {
        string ipfsHash;      // IPFS CID pointing to encrypted content
        string preview;       // Public preview text
        uint256 price;        // USDC amount (6 decimals, e.g., 10000 = $0.01)
        address creator;      // Article creator
        uint256 unlocks;      // Number of unlocks
        uint256 timestamp;    // Publication timestamp
    }

    // State variables
    mapping(uint256 => Article) public articles;
    mapping(bytes32 => bool) public nullifiersUsed;
    uint256 public articleCount;
    address public usdcAddress;

    // Events
    event ArticlePublished(
        uint256 indexed articleId,
        address indexed creator,
        string ipfsHash,
        uint256 price,
        uint256 timestamp
    );

    event ArticleUnlocked(
        uint256 indexed articleId,
        bytes32 indexed nullifier,
        address indexed payer,
        uint256 timestamp
    );

    /**
     * @notice Initialize contract with USDC address
     * @param _usdcAddress Circle USDC contract address on Arbitrum One
     */
    constructor(address _usdcAddress) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        usdcAddress = _usdcAddress;
        articleCount = 0;
    }

    /**
     * @notice Publish a new article
     * @param ipfsHash IPFS CID pointing to encrypted content
     * @param preview Public preview text (shown to all readers)
     * @param price USDC amount with 6 decimals (e.g., 10000 = $0.01)
     * @return articleId The ID of the published article
     */
    function publishArticle(
        string calldata ipfsHash,
        string calldata preview,
        uint256 price
    ) external returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(preview).length > 0, "Preview required");
        require(price > 0, "Price must be greater than 0");

        uint256 articleId = articleCount;

        articles[articleId] = Article({
            ipfsHash: ipfsHash,
            preview: preview,
            price: price,
            creator: msg.sender,
            unlocks: 0,
            timestamp: block.timestamp
        });

        articleCount++;

        emit ArticlePublished(
            articleId,
            msg.sender,
            ipfsHash,
            price,
            block.timestamp
        );

        return articleId;
    }

    /**
     * @notice Get article data
     * @param articleId The article ID to retrieve
     * @return ipfsHash IPFS CID
     * @return preview Public preview text
     * @return price USDC amount (6 decimals)
     * @return creator Article creator address
     * @return unlocks Number of unlocks
     * @return timestamp Publication timestamp
     */
    function getArticle(uint256 articleId)
        external
        view
        returns (
            string memory ipfsHash,
            string memory preview,
            uint256 price,
            address creator,
            uint256 unlocks,
            uint256 timestamp
        )
    {
        Article storage article = articles[articleId];
        require(article.creator != address(0), "Article does not exist");

        return (
            article.ipfsHash,
            article.preview,
            article.price,
            article.creator,
            article.unlocks,
            article.timestamp
        );
    }

    /**
     * @notice Get total number of articles
     * @return Total articles count
     */
    function getTotalArticles() external view returns (uint256) {
        return articleCount;
    }

    /**
     * @notice Get USDC contract address
     * @return USDC address
     */
    function getUSDCAddress() external view returns (address) {
        return usdcAddress;
    }

    /**
     * @notice Unlock article using x402 protocol
     * @dev USDC transfer is handled by facilitator off-chain before calling this function
     * @param articleId Article to unlock
     * @param nullifier Zero-knowledge nullifier (prevents double-spend)
     * @param proof Zero-knowledge proof
     * @param from User's address (EIP-3009 signer)
     * @param validAfter EIP-3009 validAfter timestamp
     * @param validBefore EIP-3009 validBefore timestamp
     * @param nonce EIP-3009 nonce (should match nullifier)
     * @param v Signature component
     * @param r Signature component
     * @param s Signature component
     * @return success True if unlock successful
     */
    function unlockArticleX402(
        uint256 articleId,
        bytes32 nullifier,
        bytes32 proof,
        address from,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (bool) {
        // Verify nullifier not already used
        require(!nullifiersUsed[nullifier], "Nullifier already used");

        // Get article data
        Article storage article = articles[articleId];
        require(article.creator != address(0), "Article does not exist");
        require(article.price > 0, "Invalid article price");

        // Verify proof is not empty (basic validation)
        require(proof != bytes32(0), "Invalid proof");

        // Mark nullifier as used
        nullifiersUsed[nullifier] = true;

        // Increment unlock count
        article.unlocks++;

        emit ArticleUnlocked(articleId, nullifier, from, block.timestamp);

        // Note: USDC transfer is handled by facilitator who calls this function
        // The facilitator has already executed transferWithAuthorization on USDC contract
        // before calling this function

        return true;
    }
}
