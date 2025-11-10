const hre = require("hardhat");

/**
 * Deploy WikiPayX402 to Arbitrum One Mainnet
 *
 * Network: Arbitrum One
 * USDC: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 (Circle USDC with EIP-3009)
 * Protocol: x402 (HTTP 402 Payment Required)
 */
async function main() {
  console.log("🚀 Deploying WikiPayX402 to Arbitrum One Mainnet...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Verify we're on Arbitrum One
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());

  if (network.chainId !== 42161n) {
    console.error("\n❌ ERROR: Not on Arbitrum One mainnet!");
    console.error("   Expected Chain ID: 42161");
    console.error("   Actual Chain ID:", network.chainId.toString());
    console.error("\n   Please update hardhat.config.js to use Arbitrum One");
    process.exit(1);
  }

  console.log("✅ Network verified: Arbitrum One\n");

  // Deploy WikiPayX402
  console.log("📦 Deploying WikiPayX402 contract...");
  const WikiPayX402 = await hre.ethers.getContractFactory("WikiPayX402");
  const wikiPayX402 = await WikiPayX402.deploy();

  await wikiPayX402.waitForDeployment();

  const contractAddress = await wikiPayX402.getAddress();
  console.log("✅ WikiPayX402 deployed to:", contractAddress);

  // Verify USDC address
  const usdcAddress = await wikiPayX402.getUSDCAddress();
  console.log("💵 USDC Address:", usdcAddress);

  if (usdcAddress !== "0xaf88d065e77c8cC2239327C5EDb3A432268e5831") {
    console.error("\n❌ WARNING: USDC address mismatch!");
    console.error("   Expected:", "0xaf88d065e77c8cC2239327C5EDb3A432268e5831");
    console.error("   Actual:", usdcAddress);
  } else {
    console.log("✅ USDC verified: Circle USDC with EIP-3009 support");
  }

  // Display deployment info
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Information:");
  console.log("   Contract: WikiPayX402");
  console.log("   Address:", contractAddress);
  console.log("   Network: Arbitrum One (Mainnet)");
  console.log("   Chain ID: 42161");
  console.log("   USDC: Circle USDC with EIP-3009");
  console.log("   Protocol: x402 (HTTP 402 Payment Required)");

  console.log("\n🔍 Verification:");
  console.log("   Arbiscan:", `https://arbiscan.io/address/${contractAddress}`);
  console.log("\n📝 Next Steps:");
  console.log("   1. Verify contract on Arbiscan:");
  console.log("      npx hardhat verify --network arbitrumOne", contractAddress);
  console.log("\n   2. Update frontend/.env.local:");
  console.log("      NEXT_PUBLIC_WIKIPAY_CONTRACT=", contractAddress);
  console.log("      NEXT_PUBLIC_CHAIN_ID=42161");
  console.log("\n   3. Test x402 flow:");
  console.log("      - Publish article with 10000 USDC (=$0.01)");
  console.log("      - Unlock with EIP-3009 transferWithAuthorization");
  console.log("      - Verify HTTP 402 responses");

  console.log("\n💡 Article Pricing:");
  console.log("   Price Format: USDC with 6 decimals");
  console.log("   Examples:");
  console.log("     • $0.01 = 10000 (10,000 micro-USDC)");
  console.log("     • $0.10 = 100000");
  console.log("     • $1.00 = 1000000");
  console.log("     • $5.00 = 5000000");

  console.log("\n🔐 Security:");
  console.log("   • USDC EIP-3009: Gasless payments");
  console.log("   • ZK Nullifiers: Anonymous unlock tracking");
  console.log("   • Direct creator payments: No intermediaries");
  console.log("   • Cross-device access: Same wallet, any device");

  console.log("\n" + "=".repeat(60));
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    contract: "WikiPayX402",
    address: contractAddress,
    network: "Arbitrum One",
    chainId: 42161,
    usdc: usdcAddress,
    protocol: "x402",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  const fs = require('fs');
  const path = require('path');

  const deploymentPath = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentPath, 'arbitrum-one-mainnet.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to: deployments/arbitrum-one-mainnet.json");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
