const hre = require("hardhat");

async function main() {
  console.log("Deploying WikiPay contract to Arbitrum Sepolia...");

  const WikiPay = await hre.ethers.getContractFactory("WikiPay");
  const wikipay = await WikiPay.deploy();

  await wikipay.waitForDeployment();

  const address = await wikipay.getAddress();
  console.log("✅ WikiPay deployed to:", address);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await wikipay.deploymentTransaction().wait(5);

  // Test basic functionality
  console.log("\n🧪 Testing basic functions...");
  const totalArticles = await wikipay.getTotalArticles();
  console.log("Total articles:", totalArticles.toString());

  console.log("\n📝 Deployment Summary:");
  console.log("- Contract address:", address);
  console.log("- Network: Arbitrum Sepolia");
  console.log("\n🔍 View on explorer:");
  console.log(`https://sepolia.arbiscan.io/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
