import { Address } from 'viem';

// Contract address (will be set after deployment)
export const WIKIPAY_ADDRESS: Address = (process.env.NEXT_PUBLIC_WIKIPAY_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

// Contract ABI
export const WIKIPAY_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "preview", "type": "string" },
      { "internalType": "string", "name": "encryptedContent", "type": "string" },
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "publishArticle",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "articleId", "type": "uint256" },
      { "internalType": "bytes32", "name": "nullifier", "type": "bytes32" },
      { "internalType": "bytes", "name": "proof", "type": "bytes" }
    ],
    "name": "unlockArticleAnonymous",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawEarnings",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "articleId", "type": "uint256" }],
    "name": "getArticle",
    "outputs": [
      { "internalType": "address", "name": "creator", "type": "address" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "uint256", "name": "totalUnlocks", "type": "uint256" },
      { "internalType": "string", "name": "preview", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "creator", "type": "address" }],
    "name": "getCreatorEarnings",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "nullifier", "type": "bytes32" }],
    "name": "isNullifierUsed",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalArticles",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "articleId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "ArticlePublished",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "articleId", "type": "uint256" },
      { "indexed": true, "internalType": "bytes32", "name": "nullifier", "type": "bytes32" }
    ],
    "name": "ArticleUnlocked",
    "type": "event"
  }
] as const;

// Price constants (from contract)
export const MIN_PRICE = BigInt("10000000000000000"); // 0.01 ETH
export const MAX_PRICE = BigInt("100000000000000000"); // 0.10 ETH
