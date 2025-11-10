const { createPublicClient, http } = require('viem');
const { arbitrumSepolia } = require('viem/chains');

// USDC on Arbitrum Sepolia
const USDC_ARBITRUM_SEPOLIA = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

// EIP-3009 interface
const EIP3009_ABI = [
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
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view'
  }
];

async function checkUSDCSupport() {
  console.log("🔍 Checking USDC EIP-3009 support on Arbitrum Sepolia...\n");

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http()
  });

  try {
    // Check basic ERC20 info
    const [name, symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: USDC_ARBITRUM_SEPOLIA,
        abi: EIP3009_ABI,
        functionName: 'name'
      }),
      publicClient.readContract({
        address: USDC_ARBITRUM_SEPOLIA,
        abi: EIP3009_ABI,
        functionName: 'symbol'
      }),
      publicClient.readContract({
        address: USDC_ARBITRUM_SEPOLIA,
        abi: EIP3009_ABI,
        functionName: 'decimals'
      })
    ]);

    console.log("✅ USDC Token Info:");
    console.log("   Address:", USDC_ARBITRUM_SEPOLIA);
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Decimals:", decimals);
    console.log("");

    // Check if transferWithAuthorization exists
    console.log("🔍 Checking EIP-3009 support...");

    // Try to get the function selector
    const code = await publicClient.getBytecode({
      address: USDC_ARBITRUM_SEPOLIA
    });

    if (code) {
      // Function selector for transferWithAuthorization
      const selector = '0xe3ee160e'; // First 4 bytes of keccak256("transferWithAuthorization(...)")

      if (code.includes(selector.slice(2))) {
        console.log("✅ EIP-3009 transferWithAuthorization: SUPPORTED");
        console.log("   Function selector:", selector);
      } else {
        console.log("❌ EIP-3009 transferWithAuthorization: NOT FOUND");
        console.log("   This USDC deployment may not support EIP-3009");
      }
    }

    console.log("\n📋 EIP-3009 Benefits for x402:");
    console.log("   • Gasless payments (relayer pays gas)");
    console.log("   • Stablecoin pricing ($1 USDC = $1)");
    console.log("   • Better UX (no ETH needed)");
    console.log("   • Signed authorizations (off-chain)");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\n⚠️  This might mean:");
    console.log("   1. USDC not deployed on Arbitrum Sepolia");
    console.log("   2. Different USDC address needed");
    console.log("   3. EIP-3009 not supported on this deployment");
  }
}

checkUSDCSupport();
