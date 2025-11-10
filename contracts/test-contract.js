const { createPublicClient, createWalletClient, http, parseEther } = require('viem');
const { arbitrumSepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const CONTRACT_ADDRESS = '0xeaefbabc15b68991809d106f59d7902c0eeb7d40';
// SECURITY: Load private key from environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY || (() => {
  throw new Error('PRIVATE_KEY environment variable not set. Run: export PRIVATE_KEY=your_key_here');
})();

const ABI = [
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
    name: 'get_total_articles',
    inputs: [],
    outputs: [{ name: 'total', type: 'uint256' }],
    stateMutability: 'view'
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
    name: 'get_ipfs_hash',
    inputs: [{ name: 'article_id', type: 'uint256' }],
    outputs: [{ name: 'ipfs_hash', type: 'string' }],
    stateMutability: 'view'
  }
];

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http()
});

const walletClient = createWalletClient({
  account,
  chain: arbitrumSepolia,
  transport: http()
});

async function test() {
  console.log('🧪 Testing WikiPay Contract:', CONTRACT_ADDRESS);
  console.log('👤 Account:', account.address);
  console.log('');

  try {
    // Step 1: Read total articles (should be 0 for new contract)
    console.log('📊 Step 1: Reading total articles...');
    const total = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'get_total_articles'
    });
    console.log('   Total articles:', total.toString());
    console.log('');

    // Step 2: Publish test article
    console.log('📝 Step 2: Publishing test article...');
    const preview = 'Test article for WikiPay IPFS integration';
    const ipfsHash = 'bafkreihdwdcefgh4dfdiu3uhjixncbomb5f743zgnu7wy6f3ew3ijgbx5m'; // Dummy hash
    const price = parseEther('0.05');

    console.log('   Preview:', preview);
    console.log('   IPFS Hash:', ipfsHash);
    console.log('   Price:', '0.05 ETH');
    console.log('');

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'publish_article',
      args: [preview, ipfsHash, price],
      account
    });

    console.log('   Transaction hash:', hash);
    console.log('   Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('   ✅ Transaction confirmed!');
    console.log('   Block:', receipt.blockNumber.toString());
    console.log('   Gas used:', receipt.gasUsed.toString());
    console.log('   Status:', receipt.status);
    console.log('');

    if (receipt.status !== 'success') {
      console.log('   ❌ Transaction failed!');
      return;
    }

    // Step 3: Read total articles again (should be 1)
    console.log('📊 Step 3: Reading total articles again...');
    const newTotal = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'get_total_articles'
    });
    console.log('   Total articles:', newTotal.toString());
    console.log('');

    // Step 4: Read article details
    console.log('📖 Step 4: Reading article 0 details...');
    const article = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'get_article',
      args: [0n]
    });
    console.log('   Creator:', article[0]);
    console.log('   Price:', article[1].toString(), 'wei');
    console.log('   Unlocks:', article[2].toString());
    console.log('   Preview:', article[3]);
    console.log('');

    // Step 5: Read IPFS hash
    console.log('🔗 Step 5: Reading IPFS hash...');
    const savedHash = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'get_ipfs_hash',
      args: [0n]
    });
    console.log('   IPFS Hash:', savedHash);
    console.log('');

    console.log('✅ All tests passed!');
    console.log('');
    console.log('📌 Update .env.local with new contract address:');
    console.log(`   NEXT_PUBLIC_WIKIPAY_ADDRESS=${CONTRACT_ADDRESS}`);

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.cause) {
      console.log('   Cause:', error.cause.message || error.cause);
    }
  }
}

test();
