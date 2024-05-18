import { ethers, run } from "hardhat";

async function main() {
  // Compile the contract
  await run("compile");

  // Get signers
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  console.log(
    "Account balance:",
    (await deployer.getBalance()).toString()
  );

  // Deploy ERC721 contract
  const ERC721Factory = await ethers.getContractFactory("ERC721");
  const erc721 = await ERC721Factory.deploy(
    "NFT Collection", // name
    "NFT", // symbol
    "https://api.example.com/metadata/", // Base URI
    "MyDomain", // EIP712 Domain Name
    "1" // EIP712 Version
  );
  console.log("ERC721 deployed to:", erc721.address);

  // Assume Auction House has its own deployment parameters adjusted
  const AuctionHouseFactory = await ethers.getContractFactory(
    "AuctionHouse"
  );
  const auctionHouse = await AuctionHouseFactory.deploy(
    erc721.address, // Address of the NFT contract
    2500 // Auction fee (for example, 2.5%)
  );
  console.log("Auction House deployed to:", auctionHouse.address);

  // Additional setup can be done here, e.g., granting minter roles
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
