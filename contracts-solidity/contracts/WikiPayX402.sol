// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WikiPayX402
 * @notice x402 Protocol Implementation with USDC EIP-3009 Support
 * @dev Implements HTTP 402 Payment Required with gasless USDC payments
 *
 * Circle USDC on Arbitrum One: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
 * Supports EIP-3009: transferWithAuthorization (gasless payments)
 */

// EIP-3009 Interface (Circle USDC)
interface IERC3009 {
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

contract WikiPayX402 {
    // Circle USDC on Arbitrum One (mainnet)
    address public constant USDC = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;

    // Article structure
    struct Article {
        string ipfsHash;    // IPFS hash for encrypted content
        string preview;     // Free preview text (x402: partial content)
        uint256 price;      // Price in USDC (6 decimals: 10000 = $0.01)
        address creator;    // Content creator
        uint256 unlocks;    // Total unlocks (x402: payment count)
        uint256 timestamp;  // Publication time
    }

    // State variables
    mapping(uint256 => Article) public articles;
    mapping(address => uint256) public creatorEarnings; // In USDC
    mapping(bytes32 => bool) public nullifiersUsed;  // ZK nullifiers for anonymous payments
    uint256 public totalArticles;

    // Events (x402 Protocol)
    event ArticlePublished(
        uint256 indexed articleId,
        address indexed creator,
        string ipfsHash,
        uint256 priceUSDC,
        uint256 timestamp
    );

    event ArticleUnlockedX402(
        uint256 indexed articleId,
        bytes32 indexed nullifier,  // Anonymous payment proof
        uint256 priceUSDC,
        uint256 timestamp
    );

    event EarningsWithdrawn(
        address indexed creator,
        uint256 amountUSDC,
        uint256 timestamp
    );

    /**
     * @notice Publish a new article (x402: Create paywall)
     * @param ipfsHash IPFS hash containing encrypted full content
     * @param preview Free preview text (x402: partial content before 402)
     * @param priceUSDC Price in USDC (6 decimals: 10000 = $0.01)
     * @return articleId The ID of the published article
     */
    function publishArticle(
        string calldata ipfsHash,
        string calldata preview,
        uint256 priceUSDC
    ) external returns (uint256) {
        require(bytes(ipfsHash).length > 0, "x402: IPFS hash required");
        require(bytes(preview).length > 0, "x402: Preview required");
        require(priceUSDC > 0, "x402: Price must be greater than 0");

        uint256 articleId = totalArticles;

        articles[articleId] = Article({
            ipfsHash: ipfsHash,
            preview: preview,
            price: priceUSDC,
            creator: msg.sender,
            unlocks: 0,
            timestamp: block.timestamp
        });

        totalArticles++;

        emit ArticlePublished(
            articleId,
            msg.sender,
            ipfsHash,
            priceUSDC,
            block.timestamp
        );

        return articleId;
    }

    /**
     * @notice Unlock article with USDC using EIP-3009 (gasless payment)
     * @dev Implements x402 protocol: Payment verification via transferWithAuthorization
     *
     * This is the CORE x402 payment method:
     * - User signs USDC authorization off-chain (no gas)
     * - Contract verifies signature and transfers USDC
     * - Nullifier prevents double-unlock (anonymous proof)
     *
     * @param articleId Article to unlock
     * @param nullifier ZK nullifier (prevents double-unlock, preserves anonymity)
     * @param proof ZK proof (for future Plonky2 integration)
     * @param from User's address (USDC sender)
     * @param validAfter Timestamp after which transfer is valid
     * @param validBefore Timestamp before which transfer is valid
     * @param nonce Unique nonce for this authorization
     * @param v Signature parameter
     * @param r Signature parameter
     * @param s Signature parameter
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
        // x402 validation
        require(articleId < totalArticles, "x402: Article does not exist");
        require(!nullifiersUsed[nullifier], "x402: Payment already processed");
        require(proof != bytes32(0), "x402: Invalid proof");
        require(block.timestamp >= validAfter, "x402: Authorization not yet valid");
        require(block.timestamp <= validBefore, "x402: Authorization expired");

        Article storage article = articles[articleId];

        // Execute EIP-3009 transfer (gasless USDC payment)
        IERC3009(USDC).transferWithAuthorization(
            from,                   // User's wallet
            article.creator,        // Content creator (direct payment)
            article.price,          // Price in USDC
            validAfter,
            validBefore,
            nonce,
            v, r, s
        );

        // Mark nullifier as used (x402: payment processed)
        nullifiersUsed[nullifier] = true;

        // Update stats
        creatorEarnings[article.creator] += article.price;
        article.unlocks++;

        // Emit x402 unlock event
        emit ArticleUnlockedX402(
            articleId,
            nullifier,
            article.price,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Get article details (x402: Preview + payment info)
     * @param articleId The ID of the article
     * @return ipfsHash IPFS hash for encrypted content
     * @return preview Free preview text
     * @return price Price in USDC (6 decimals)
     * @return creator Content creator address
     * @return unlocks Total unlock count
     * @return timestamp Publication timestamp
     */
    function getArticle(uint256 articleId) external view returns (
        string memory ipfsHash,
        string memory preview,
        uint256 price,
        address creator,
        uint256 unlocks,
        uint256 timestamp
    ) {
        require(articleId < totalArticles, "x402: Article does not exist");
        Article memory article = articles[articleId];
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
     * @notice Check if nullifier has been used (x402: Verify payment status)
     * @param nullifier The nullifier hash to check
     * @return True if payment processed, false if payment required
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return nullifiersUsed[nullifier];
    }

    /**
     * @notice Get creator earnings in USDC
     * @param creator The creator address
     * @return Earnings in USDC (6 decimals)
     */
    function getCreatorEarnings(address creator) external view returns (uint256) {
        return creatorEarnings[creator];
    }

    /**
     * @notice Get total articles published
     * @return Total number of articles
     */
    function getTotalArticles() external view returns (uint256) {
        return totalArticles;
    }

    /**
     * @notice Get USDC contract address
     * @return Circle USDC address on Arbitrum One
     */
    function getUSDCAddress() external pure returns (address) {
        return USDC;
    }

    /**
     * @notice Get article price in USDC with formatted decimals
     * @param articleId The article ID
     * @return priceUSDC Price in USDC (6 decimals)
     * @return priceFormatted Price as human-readable string (e.g., "0.01")
     */
    function getPriceFormatted(uint256 articleId) external view returns (
        uint256 priceUSDC,
        string memory priceFormatted
    ) {
        require(articleId < totalArticles, "x402: Article does not exist");
        uint256 price = articles[articleId].price;

        // Convert 10000 (6 decimals) → "0.01"
        uint256 dollars = price / 1_000_000;
        uint256 cents = (price % 1_000_000) / 10_000;

        priceFormatted = string(abi.encodePacked(
            _toString(dollars),
            ".",
            cents < 10 ? "0" : "",
            _toString(cents)
        ));

        return (price, priceFormatted);
    }

    // Helper: Convert uint to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
