import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

// Contract address from environment
export const WIKIPAY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WIKIPAY_ADDRESS as `0x${string}`;

// Contract ABI (minimal for publish function)
export const WIKIPAY_ABI = [
  {
    type: 'function',
    name: 'publish_article',
    inputs: [
      { name: 'preview', type: 'string' },
      { name: 'encrypted_content', type: 'string' },
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
    name: 'get_encrypted_content',
    inputs: [{ name: 'article_id', type: 'uint256' }],
    outputs: [{ name: 'content', type: 'string' }],
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

// Helper: Publish article to blockchain
export async function publishArticle({
  title,
  preview,
  content,
  priceUSD
}: {
  title: string;
  preview: string;
  content: string;
  priceUSD: string;
}) {
  console.log("📝 Publishing article to Stylus contract...");
  console.log("Contract:", WIKIPAY_CONTRACT_ADDRESS);

  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();

  console.log("Account:", account);

  // For MVP: Store title + content together (in production, encrypt this)
  const fullContent = `# ${title}\n\n${content}`;

  // Convert USD price to wei (simplified - in production use oracle)
  // Assuming 1 ETH = $2000 for demo
  const priceInETH = parseFloat(priceUSD) / 2000;
  const priceWei = parseEther(priceInETH.toString());

  console.log("Price in USD:", priceUSD);
  console.log("Price in ETH:", priceInETH);
  console.log("Price in Wei:", priceWei.toString());

  try {
    // Call publish_article on the contract
    const hash = await walletClient.writeContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'publish_article',
      args: [preview, fullContent, priceWei],
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
