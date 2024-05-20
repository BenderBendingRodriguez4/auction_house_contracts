// Importing necessary libraries and functions
const { ethers, run } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  console.log(
    "Account balance:",
    (await deployer.getBalance()).toString()
  );

  // Deploy Mock ERC20 Token
  const MockToken = await ethers.getContractFactory("mock_erc20");
  const mockToken = await MockToken.deploy("Mock Token", "MTK", 18);
  await mockToken.deployed();
  console.log("Mock Token deployed to:", mockToken.address);

  // Verify Mock Token
  try {
    await run("verify:verify", {
      address: mockToken.address,
      constructorArguments: ["Mock Token", "MTK", 18],
    });
  } catch (error) {
    console.error("Verification failed for Mock Token:", error);
  }

  // Deploy NFT Contract
  const NFT = await ethers.getContractFactory("nft");
  const nft = await NFT.deploy(
    "Saturn Legend Series",
    "SLS",
    "https://test.url",
    "Saturn Legend Series",
    "1"
  );
  await nft.deployed();
  console.log("NFT deployed to:", nft.address);

  // Verify NFT Contract
  try {
    await run("verify:verify", {
      address: nft.address,
      constructorArguments: [
        "Saturn Legend Series",
        "SLS",
        "https://test.url",
        "Saturn Legend Series",
        "1",
      ],
    });
  } catch (error) {
    console.error("Verification failed for NFT Contract:", error);
  }

  // Deploy Auction House
  const AuctionHouse = await ethers.getContractFactory("auction");
  const auctionHouse = await AuctionHouse.deploy(
    mockToken.address,
    nft.address,
    50
  );
  await auctionHouse.deployed();
  console.log("Auction House deployed to:", auctionHouse.address);

  // Verify Auction House
  try {
    await run("verify:verify", {
      address: auctionHouse.address,
      constructorArguments: [mockToken.address, nft.address, 50],
    });
  } catch (error) {
    console.error("Verification failed for Auction House:", error);
  }

  // Post-deployment setup
  await auctionHouse.set_auctioneer(deployer.address);
  await nft.set_minter(auctionHouse.address, true);

  console.log("Setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
