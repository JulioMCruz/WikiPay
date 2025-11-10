const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying WikiPayX402 to Arbitrum One Mainnet...\n");

  // Circle USDC address on Arbitrum One (with EIP-3009 support)
  const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

  console.log("📋 Deployment Configuration:");
  console.log("   Network: Arbitrum One");
  console.log("   Chain ID: 42161");
  console.log("   USDC Address:", USDC_ADDRESS);
  console.log("");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying from account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  console.log("📦 Deploying WikiPayX402 contract...");
  const WikiPayX402 = await hre.ethers.getContractFactory("WikiPayX402");
  const contract = await WikiPayX402.deploy(USDC_ADDRESS);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("");

  // Verify contract data
  console.log("🔍 Verifying deployment...");
  const totalArticles = await contract.getTotalArticles();
  const usdcAddress = await contract.getUSDCAddress();

  console.log("   Total Articles:", totalArticles.toString());
  console.log("   USDC Address:", usdcAddress);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: "arbitrum-one",
    chainId: 42161,
    contractAddress: contractAddress,
    usdcAddress: USDC_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: contract.deploymentTransaction().blockNumber,
    transactionHash: contract.deploymentTransaction().hash,
  };

  const fs = require("fs");
  const path = require("path");

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "arbitrum-one-latest.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to: deployments/arbitrum-one-latest.json");
  console.log("");

  console.log("🎉 Deployment Complete!");
  console.log("");
  console.log("📝 Next Steps:");
  console.log("   1. Update frontend/.env.local with new contract address");
  console.log("   2. Verify contract on Arbiscan:");
  console.log(`      npx hardhat verify --network arbitrum-one ${contractAddress} "${USDC_ADDRESS}"`);
  console.log("   3. Test contract functions");
  console.log("");
  console.log("🔗 View on Arbiscan:");
  console.log(`   https://arbiscan.io/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
