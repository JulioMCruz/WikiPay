const hre = require("hardhat");

async function main() {
  console.log("Deploying WikiPay contract to Arbitrum Sepolia...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy contract
  const WikiPay = await hre.ethers.getContractFactory("WikiPay");
  const wikipay = await WikiPay.deploy();

  await wikipay.waitForDeployment();

  const address = await wikipay.getAddress();
  console.log("WikiPay deployed to:", address);

  // Verify contract info
  const minPrice = await wikipay.MIN_PRICE();
  const maxPrice = await wikipay.MAX_PRICE();
  console.log("Min price:", hre.ethers.formatEther(minPrice), "ETH");
  console.log("Max price:", hre.ethers.formatEther(maxPrice), "ETH");

  console.log("\nDeployment complete!");
  console.log("\nAdd to .env:");
  console.log(`NEXT_PUBLIC_WIKIPAY_ADDRESS=${address}`);

  console.log("\nVerify contract:");
  console.log(`npx hardhat verify --network arbitrumSepolia ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
