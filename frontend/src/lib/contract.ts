import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

// Contract address from environment
export const WIKIPAY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WIKIPAY_ADDRESS as `0x${string}`;

// Contract ABI (updated for IPFS integration)
export const WIKIPAY_ABI = [
  {
    type: 'function',
    name: 'publish_article',
    inputs: [
      { name: 'preview', type: 'string' },
      { name: 'ipfs_hash', type: 'string' },
      { name: 'price', type: 'uint256' }
    ],
    outputs: [{ name: 'article_id', type: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'get_article',
    inputs: [{ name: 'article_id', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'unlocks', type: 'uint256' },
      { name: 'preview', type: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'get_total_articles',
    inputs: [],
    outputs: [{ name: 'total', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'unlock_article_anonymous',
    inputs: [
      { name: 'article_id', type: 'uint256' },
      { name: 'nullifier', type: 'bytes32' },
      { name: 'proof', type: 'bytes32' }
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'get_ipfs_hash',
    inputs: [{ name: 'article_id', type: 'uint256' }],
    outputs: [{ name: 'ipfs_hash', type: 'string' }],
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
    // Call publish_article with IPFS hash (NOT full content)
    const hash = await walletClient.writeContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'publish_article',
      args: [preview, ipfsHash, priceWei],
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
    functionName: 'get_total_articles'
  });
  return result;
}

// Helper: Get article details
export async function getArticle(articleId: bigint) {
  const result = await publicClient.readContract({
    address: WIKIPAY_CONTRACT_ADDRESS,
    abi: WIKIPAY_ABI,
    functionName: 'get_article',
    args: [articleId]
  });

  return {
    creator: result[0],
    price: result[1],
    unlocks: result[2],
    preview: result[3]
  };
}
