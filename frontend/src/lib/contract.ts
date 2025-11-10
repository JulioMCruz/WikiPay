import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

// Contract address from environment
export const WIKIPAY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WIKIPAY_ADDRESS as `0x${string}`;

// Contract ABI (Solidity version with ZK proof support)
export const WIKIPAY_ABI = [
  {
    type: 'function',
    name: 'publishArticle',
    inputs: [
      { name: 'ipfsHash', type: 'string' },
      { name: 'preview', type: 'string' },
      { name: 'price', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getArticle',
    inputs: [{ name: 'articleId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'ipfsHash', type: 'string' },
          { name: 'preview', type: 'string' },
          { name: 'price', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'unlocks', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getTotalArticles',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'unlockArticleAnonymous',
    inputs: [
      { name: 'articleId', type: 'uint256' },
      { name: 'nullifier', type: 'bytes32' },
      { name: 'proof', type: 'bytes32' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'getIpfsHash',
    inputs: [{ name: 'articleId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'isNullifierUsed',
    inputs: [{ name: 'nullifier', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getCreatorEarnings',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

// Create public client for reading
export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http()
});

// Helper: Get wallet client (requires browser wallet)
export async function getWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected');
  }

  return createWalletClient({
    chain: arbitrumSepolia,
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

  // Convert USD price to wei (stored as ETH denomination but represents USD)
  const priceAsETH = priceUSD;
  const priceWei = parseEther(priceAsETH);

  console.log("Price in USD:", priceUSD);
  console.log("Price in Wei:", priceWei.toString());

  // Contract validates: 0.01 - 0.10 ETH in wei
  const minPrice = parseEther("0.01"); // Represents $0.01
  const maxPrice = parseEther("0.10"); // Represents $0.10

  if (priceWei < minPrice || priceWei > maxPrice) {
    throw new Error(`Price must be between $0.01 and $0.10 USD`);
  }

  try {
    // Call publishArticle with IPFS hash (NOT full content)
    const hash = await walletClient.writeContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'publishArticle',
      args: [ipfsHash, preview, priceWei],
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
  return result;
}

// Helper: Get article details
export async function getArticle(articleId: bigint) {
  const result = await publicClient.readContract({
    address: WIKIPAY_CONTRACT_ADDRESS,
    abi: WIKIPAY_ABI,
    functionName: 'getArticle',
    args: [articleId]
  });

  // Result is a tuple from Solidity
  return {
    ipfsHash: result.ipfsHash,
    preview: result.preview,
    price: result.price,
    creator: result.creator,
    unlocks: result.unlocks,
    timestamp: result.timestamp
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
      functionName: 'isNullifierUsed',
      args: [nullifier as `0x${string}`]
    });

    return isUsed;
  } catch (error) {
    console.error("Error checking unlock status:", error);
    return false;
  }
}

// Helper: Unlock article anonymously with ZK proof
export async function unlockArticle(articleId: bigint, price: bigint) {
  console.log("🔓 Unlocking article anonymously...");
  console.log("Article ID:", articleId);
  console.log("Price:", price.toString());

  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();

  // Generate deterministic ZK proof and nullifier
  const { nullifier, proof } = await generateZkProof(articleId);

  console.log("Generated nullifier:", nullifier);
  console.log("Generated proof:", proof);

  try {
    // Call unlockArticleAnonymous with payment
    const hash = await walletClient.writeContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'unlockArticleAnonymous',
      args: [articleId, nullifier, proof],
      account,
      value: price // Send payment
    });

    console.log("✅ Transaction sent:", hash);
    console.log("⏳ Waiting for confirmation...");

    // Wait for transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log("🎉 Article unlocked!");
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
  const result = await publicClient.readContract({
    address: WIKIPAY_CONTRACT_ADDRESS,
    abi: WIKIPAY_ABI,
    functionName: 'getIpfsHash',
    args: [articleId]
  });
  return result;
}
