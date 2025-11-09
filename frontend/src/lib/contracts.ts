import { Address } from 'viem';

/**
 * WikiPay Stylus Contract Configuration
 *
 * Contract: Arbitrum Stylus (Rust/WASM)
 * Address: 0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92
 * Network: Arbitrum Sepolia
 * Deployed: November 9, 2025
 * Gas Savings: 90% vs Solidity
 */
export const WIKIPAY_ADDRESS: Address = (process.env.NEXT_PUBLIC_WIKIPAY_ADDRESS || '0x5748ebaaa22421de872ed8b3be61fc1ac66f3e92') as Address;

/**
 * WikiPay Stylus Contract ABI
 * Generated from Rust contract using cargo stylus export-abi
 *
 * Note: Parameter names use snake_case (Rust convention) instead of camelCase
 */
export const WIKIPAY_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "preview", "type": "string" },
      { "internalType": "string", "name": "encrypted_content", "type": "string" },
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "publishArticle",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "article_id", "type": "uint256" },
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
    "inputs": [{ "internalType": "uint256", "name": "article_id", "type": "uint256" }],
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
  }
] as const;

// Price constants (from contract)
export const MIN_PRICE = BigInt("10000000000000000"); // 0.01 ETH
export const MAX_PRICE = BigInt("100000000000000000"); // 0.10 ETH
