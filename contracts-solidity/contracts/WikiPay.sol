// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WikiPay
 * @notice Decentralized article publishing platform with IPFS storage
 * @dev Stores minimal on-chain data, full articles stored on IPFS
 */
contract WikiPay {
    // Article structure
    struct Article {
        string ipfsHash;    // CIDv0 (Qm...) or CIDv1 (baf...)
        string preview;     // Short preview text
        uint256 price;      // Price in wei
        address creator;    // Article creator
        uint256 unlocks;    // Number of times unlocked
        uint256 timestamp;  // Creation timestamp
    }

    // State variables
    mapping(uint256 => Article) public articles;
    mapping(address => uint256) public creatorEarnings;
    uint256 public totalArticles;

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
        address indexed reader,
        uint256 price,
        uint256 timestamp
    );

    /**
     * @notice Publish a new article
     * @param ipfsHash IPFS hash (CIDv0 or CIDv1)
     * @param preview Short preview text
     * @param price Price in wei to unlock full article
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

        uint256 articleId = totalArticles;

        articles[articleId] = Article({
            ipfsHash: ipfsHash,
            preview: preview,
            price: price,
            creator: msg.sender,
            unlocks: 0,
            timestamp: block.timestamp
        });

        totalArticles++;

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
     * @notice Unlock an article by paying the price
     * @param articleId The ID of the article to unlock
     */
    function unlockArticle(uint256 articleId) external payable {
        require(articleId < totalArticles, "Article does not exist");

        Article storage article = articles[articleId];
        require(msg.value >= article.price, "Insufficient payment");

        // Transfer payment to creator
        creatorEarnings[article.creator] += msg.value;
        article.unlocks++;

        emit ArticleUnlocked(
            articleId,
            msg.sender,
            msg.value,
            block.timestamp
        );
    }

    /**
     * @notice Withdraw earnings for creators
     */
    function withdrawEarnings() external {
        uint256 earnings = creatorEarnings[msg.sender];
        require(earnings > 0, "No earnings to withdraw");

        creatorEarnings[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: earnings}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Get article details
     * @param articleId The ID of the article
     * @return Article struct with all details
     */
    function getArticle(uint256 articleId) external view returns (Article memory) {
        require(articleId < totalArticles, "Article does not exist");
        return articles[articleId];
    }

    /**
     * @notice Get total number of articles
     * @return Total articles published
     */
    function getTotalArticles() external view returns (uint256) {
        return totalArticles;
    }

    /**
     * @notice Get IPFS hash for an article
     * @param articleId The ID of the article
     * @return IPFS hash string
     */
    function getIpfsHash(uint256 articleId) external view returns (string memory) {
        require(articleId < totalArticles, "Article does not exist");
        return articles[articleId].ipfsHash;
    }

    /**
     * @notice Get preview for an article
     * @param articleId The ID of the article
     * @return Preview text
     */
    function getPreview(uint256 articleId) external view returns (string memory) {
        require(articleId < totalArticles, "Article does not exist");
        return articles[articleId].preview;
    }

    /**
     * @notice Get price for an article
     * @param articleId The ID of the article
     * @return Price in wei
     */
    function getPrice(uint256 articleId) external view returns (uint256) {
        require(articleId < totalArticles, "Article does not exist");
        return articles[articleId].price;
    }

    /**
     * @notice Get creator earnings
     * @param creator The creator address
     * @return Earnings in wei
     */
    function getCreatorEarnings(address creator) external view returns (uint256) {
        return creatorEarnings[creator];
    }
}
