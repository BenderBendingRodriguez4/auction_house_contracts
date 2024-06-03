// Importing necessary libraries and functions
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(deployer);
  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  console.log(
    "Account balance:",
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  // Deploy Mock ERC20 Token
  const MockToken = await ethers.getContractFactory("mock_erc20");
  const mockToken = await MockToken.deploy("Mock Token", "MTK", 18);
  await mockToken.waitForDeployment();
  const mockTokenAddress = await mockToken.getAddress();
  console.log("Mock Token deployed to:", mockTokenAddress);

  // Deploy NFT Contract
  const NFT = await ethers.getContractFactory("nft");
  const nft = await NFT.deploy(
    "Saturn Legend Series",
    "SLS",
    "https://test.url",
    "Saturn Legend Series",
    "1"
  );
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("NFT deployed to:", nftAddress);

  // Deploy Auction House
  const AuctionHouse = await ethers.getContractFactory("auction");
  const auctionHouse = await AuctionHouse.deploy(
    mockTokenAddress,
    nftAddress,
    50
  );
  await auctionHouse.waitForDeployment();
  const auctionHouseAddress = await auctionHouse.getAddress();
  console.log("Auction House deployed to:", auctionHouseAddress);

  // Post-deployment setup
  await auctionHouse.set_auctioneer(deployer.address);
  await nft.set_minter(auctionHouseAddress, true);

  console.log("Setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
