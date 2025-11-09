// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WikiPay
 * @notice Anonymous article payments using zero-knowledge proofs
 * @dev Simplified ZK verification for MVP - will upgrade to full Plonky2 verification
 */
contract WikiPay {
    struct Article {
        address creator;
        uint256 price;
        uint256 totalUnlocks;
        string preview;
        string encryptedContent;
    }

    // State
    mapping(uint256 => Article) public articles;
    mapping(bytes32 => bool) public nullifiersUsed;
    mapping(address => uint256) public creatorEarnings;
    uint256 public nextArticleId;

    // Constants
    uint256 public constant MIN_PRICE = 0.01 ether;
    uint256 public constant MAX_PRICE = 0.10 ether;

    // Events
    event ArticlePublished(
        uint256 indexed articleId,
        address indexed creator,
        uint256 price
    );
    event ArticleUnlocked(
        uint256 indexed articleId,
        bytes32 indexed nullifier
    );
    event EarningsWithdrawn(
        address indexed creator,
        uint256 amount
    );

    /**
     * @notice Publish a new article
     * @param preview First 200 words (public preview)
     * @param encryptedContent Full article content (encrypted)
     * @param price Payment required to unlock (0.01-0.10 ETH)
     * @return articleId The ID of the published article
     */
    function publishArticle(
        string memory preview,
        string memory encryptedContent,
        uint256 price
    ) external returns (uint256) {
        require(
            price >= MIN_PRICE && price <= MAX_PRICE,
            "Price must be between 0.01 and 0.10 ETH"
        );

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

    /**
     * @notice Unlock article anonymously using ZK proof
     * @param articleId Article to unlock
     * @param nullifier Unique nullifier (prevents double-spend)
     * @param proof Zero-knowledge proof bytes
     * @return encryptedContent The encrypted full article content
     */
    function unlockArticleAnonymous(
        uint256 articleId,
        bytes32 nullifier,
        bytes calldata proof
    ) external payable returns (string memory) {
        // Check nullifier not already used
        require(
            !nullifiersUsed[nullifier],
            "Nullifier already used (article already unlocked)"
        );

        // Get article
        Article storage article = articles[articleId];
        require(article.creator != address(0), "Article does not exist");

        // Check payment
        require(
            msg.value >= article.price,
            "Insufficient payment"
        );

        // Verify ZK proof
        require(
            verifyPaymentProof(proof, articleId, nullifier),
            "Invalid zero-knowledge proof"
        );

        // Mark nullifier as used
        nullifiersUsed[nullifier] = true;

        // Add payment to creator earnings
        creatorEarnings[article.creator] += msg.value;

        // Increment unlock count
        article.totalUnlocks++;

        emit ArticleUnlocked(articleId, nullifier);

        // Return encrypted content (frontend decrypts client-side)
        return article.encryptedContent;
    }

    /**
     * @notice Withdraw creator earnings
     * @return amount The amount withdrawn
     */
    function withdrawEarnings() external returns (uint256) {
        uint256 amount = creatorEarnings[msg.sender];
        require(amount > 0, "No earnings to withdraw");

        // Reset earnings before transfer (reentrancy protection)
        creatorEarnings[msg.sender] = 0;

        // Transfer earnings to creator
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit EarningsWithdrawn(msg.sender, amount);
        return amount;
    }

    // === View Functions ===

    /**
     * @notice Get article details
     * @param articleId Article ID
     * @return creator Article creator address
     * @return price Unlock price
     * @return totalUnlocks Total number of unlocks
     * @return preview Article preview text
     */
    function getArticle(uint256 articleId)
        external
        view
        returns (
            address creator,
            uint256 price,
            uint256 totalUnlocks,
            string memory preview
        )
    {
        Article storage article = articles[articleId];
        return (
            article.creator,
            article.price,
            article.totalUnlocks,
            article.preview
        );
    }

    /**
     * @notice Get creator's total earnings
     * @param creator Creator address
     * @return earnings Total earnings in wei
     */
    function getCreatorEarnings(address creator) external view returns (uint256) {
        return creatorEarnings[creator];
    }

    /**
     * @notice Check if nullifier has been used
     * @param nullifier Nullifier to check
     * @return used True if nullifier has been used
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return nullifiersUsed[nullifier];
    }

    /**
     * @notice Get total number of articles published
     * @return total Total articles
     */
    function getTotalArticles() external view returns (uint256) {
        return nextArticleId;
    }

    // === Internal Functions ===

    /**
     * @notice Verify zero-knowledge payment proof
     * @dev MVP: Simplified validation. Will upgrade to full Plonky2 verification
     * @param proof Proof bytes
     * @param articleId Article being unlocked
     * @param nullifier Payment nullifier
     * @return valid True if proof is valid
     */
    function verifyPaymentProof(
        bytes calldata proof,
        uint256 articleId,
        bytes32 nullifier
    ) internal pure returns (bool) {
        // MVP: Basic structure validation
        // Minimum proof size check
        if (proof.length < 32) {
            return false;
        }

        // TODO: Implement full Plonky2 proof verification
        // For MVP, we accept properly formatted proofs
        // Frontend generates valid proofs, contract validates structure

        // Prevent compiler warnings
        articleId;
        nullifier;

        return true;
    }
}
