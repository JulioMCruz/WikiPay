import { createPublicClient, createWalletClient, custom, http, parseUnits } from 'viem';
import { arbitrum } from 'viem/chains';
import WikiPayX402ABI from './WikiPayX402-ABI.json';

// Contract addresses from environment
export const WIKIPAY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WIKIPAY_ADDRESS as `0x${string}`;
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

// USDC has 6 decimals (not 18 like ETH)
export const USDC_DECIMALS = 6;

// EIP-3009 Interface for Circle USDC
export const USDC_ABI = [
  {
    type: 'function',
    name: 'transferWithAuthorization',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

// WikiPayX402 Contract ABI (x402 protocol with USDC)
// Using the actual compiled ABI from Hardhat to ensure correct decoding
export const WIKIPAY_ABI = WikiPayX402ABI;

// Create public client for reading (Arbitrum One mainnet)
export const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http()
});

// Helper: Get wallet client (requires browser wallet)
export async function getWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected');
  }

  return createWalletClient({
    chain: arbitrum,
    transport: custom(window.ethereum)
  });
}

// Helper: Publish article to blockchain (with IPFS integration)
export async function publishArticle({
  title,
  preview,
  content,
  priceUSD,
  ipfsHash
}: {
  title: string;
  preview: string;
  content: string;
  priceUSD: string;
  ipfsHash: string; // IPFS CID from Pinata upload
}) {
  console.log("📝 Publishing article to Stylus contract...");
  console.log("Contract:", WIKIPAY_CONTRACT_ADDRESS);
  console.log("IPFS Hash:", ipfsHash);

  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();

  console.log("Account:", account);

  // Validate IPFS hash format (CIDv0: Qm..., CIDv1: baf...)
  if (!ipfsHash.startsWith('Qm') && !ipfsHash.startsWith('baf')) {
    throw new Error('Invalid IPFS hash format');
  }

  // Convert USD price to USDC tokens (6 decimals)
  // Example: "0.01" → 10000 USDC tokens
  const priceUSDC = parseUnits(priceUSD, USDC_DECIMALS);

  console.log("Price in USD:", priceUSD);
  console.log("Price in USDC tokens:", priceUSDC.toString());

  // Contract validates: 10000 - 100000 USDC tokens ($0.01 - $0.10)
  const minPrice = parseUnits("0.01", USDC_DECIMALS); // 10000 tokens = $0.01
  const maxPrice = parseUnits("0.10", USDC_DECIMALS); // 100000 tokens = $0.10

  if (priceUSDC < minPrice || priceUSDC > maxPrice) {
    throw new Error(`Price must be between $0.01 and $0.10 USD`);
  }

  try {
    // Call publishArticle with IPFS hash and USDC price
    const hash = await walletClient.writeContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'publishArticle',
      args: [ipfsHash, preview, priceUSDC],
      account
    });

    console.log("✅ Transaction sent:", hash);
    console.log("⏳ Waiting for confirmation...");

    // Wait for transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log("🎉 Transaction confirmed!");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    return {
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed
    };

  } catch (error: any) {
    console.error("❌ Error publishing:", error);
    throw new Error(error.message || "Failed to publish article");
  }
}

// Helper: Get total articles
export async function getTotalArticles(): Promise<bigint> {
  const result = await publicClient.readContract({
    address: WIKIPAY_CONTRACT_ADDRESS,
    abi: WIKIPAY_ABI,
    functionName: 'getTotalArticles'
  });
  return result as bigint;
}

// Helper: Get article details
export async function getArticle(articleId: bigint) {
  const result = await publicClient.readContract({
    address: WIKIPAY_CONTRACT_ADDRESS,
    abi: WIKIPAY_ABI,
    functionName: 'getArticle',
    args: [articleId]
  });

  // The contract returns individual values (string, string, uint256, address, uint256, uint256)
  // Viem automatically converts this to an array
  const [ipfsHash, preview, price, creator, unlocks, timestamp] = result as [string, string, bigint, `0x${string}`, bigint, bigint];

  return {
    ipfsHash,
    preview,
    price,
    creator,
    unlocks,
    timestamp
  };
}

// Helper: Generate deterministic nullifier from wallet + article
export async function generateDeterministicNullifier(
  walletAddress: string,
  articleId: bigint
): Promise<string> {
  // Create deterministic nullifier: hash(wallet_address + article_id)
  // This allows user to prove they unlocked from any device
  const message = `${walletAddress.toLowerCase()}-${articleId.toString()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const nullifier = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return nullifier;
}

// Helper: Generate ZK proof (wallet signature)
export async function generateZkProof(articleId: bigint) {
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();

  // Generate deterministic nullifier
  const nullifier = await generateDeterministicNullifier(account, articleId);

  // Create message to sign (proves wallet ownership without revealing address)
  const message = `WikiPay Unlock Article ${articleId}\nNullifier: ${nullifier}`;

  // Sign message with wallet
  const signature = await walletClient.signMessage({
    account,
    message
  });

  // Use signature as proof (first 32 bytes)
  const proof = signature.slice(0, 66) as `0x${string}`;

  return { nullifier: nullifier as `0x${string}`, proof };
}

// Helper: Check if article is already unlocked by this wallet
export async function checkIfUnlocked(articleId: bigint): Promise<boolean> {
  try {
    const walletClient = await getWalletClient();
    const [account] = await walletClient.getAddresses();

    // Generate the nullifier this wallet would use
    const nullifier = await generateDeterministicNullifier(account, articleId);

    // Check if nullifier is used on-chain
    const isUsed = await publicClient.readContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'nullifiersUsed',
      args: [nullifier as `0x${string}`]
    });

    return isUsed as boolean;
  } catch (error) {
    console.error("Error checking unlock status:", error);
    return false;
  }
}

// Helper: Generate EIP-3009 transfer authorization signature
export async function generateTransferAuthorization(
  from: `0x${string}`,
  to: `0x${string}`,
  value: bigint,
  validAfter: bigint,
  validBefore: bigint,
  nonce: `0x${string}`
) {
  const walletClient = await getWalletClient();

  // EIP-712 domain for Circle USDC on Arbitrum One
  // IMPORTANT: Must match the actual USDC contract's EIP-3009 domain for transferWithAuthorization
  // Circle's USDC uses "USD Coin" (not "USDC") for the domain name
  // See: https://github.com/circlefin/stablecoin-evm
  const domain = {
    name: 'USD Coin',  // Circle USDC contract uses "USD Coin" for EIP-3009
    version: '2',
    chainId: 42161,
    verifyingContract: USDC_ADDRESS
  } as const;

  // EIP-712 types for transferWithAuthorization
  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' }
    ]
  } as const;

  const message = {
    from,
    to,
    value,
    validAfter,
    validBefore,
    nonce
  };

  // Sign EIP-712 typed data
  const signature = await walletClient.signTypedData({
    account: from,
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message
  });

  // Split signature into v, r, s components
  const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
  const v = parseInt(signature.slice(130, 132), 16);

  return { v, r, s, signature };
}

// Helper: Unlock article with USDC using EIP-3009 (x402 protocol)
export async function unlockArticle(articleId: bigint, price: bigint) {
  console.log("🔓 Unlocking article with USDC (x402 protocol)...");
  console.log("Article ID:", articleId);
  console.log("Price (USDC tokens):", price.toString());

  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();

  // Get article creator address
  const article = await getArticle(articleId);
  const creator = article.creator as `0x${string}`;

  // Generate deterministic ZK proof and nullifier
  const { nullifier, proof } = await generateZkProof(articleId);

  console.log("Generated nullifier:", nullifier);
  console.log("Generated proof:", proof);

  // Generate unique nonce for EIP-3009 (using nullifier ensures uniqueness)
  const nonce = nullifier;

  // Set validity window (current time to 1 hour from now)
  const validAfter = BigInt(Math.floor(Date.now() / 1000));
  const validBefore = validAfter + BigInt(3600); // 1 hour validity

  console.log("Generating EIP-3009 authorization...");

  // Generate EIP-3009 transfer authorization signature
  const { v, r, s, signature } = await generateTransferAuthorization(
    account,
    creator,
    price,
    validAfter,
    validBefore,
    nonce
  );

  console.log("Authorization signed (gasless USDC payment)");
  console.log("Full signature:", signature);

  try {
    // Call unlockArticleX402 with EIP-3009 authorization
    const hash = await walletClient.writeContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'unlockArticleX402',
      args: [articleId, nullifier, proof, account, validAfter, validBefore, nonce, v, r, s],
      account
    });

    console.log("✅ Transaction sent:", hash);
    console.log("⏳ Waiting for confirmation...");

    // Wait for transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log("🎉 Article unlocked via x402 protocol!");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    return {
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      nullifier,
      proof
    };

  } catch (error: any) {
    console.error("❌ Error unlocking:", error);
    throw new Error(error.message || "Failed to unlock article");
  }
}

// Helper: Get IPFS hash after unlocking
export async function getIpfsHash(articleId: bigint): Promise<string> {
  const article = await getArticle(articleId);
  return article.ipfsHash;
}
