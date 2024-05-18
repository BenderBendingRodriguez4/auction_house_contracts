import { expect } from "chai";
import { BaseContract, ContractTransactionResponse } from "ethers";
import { ethers } from "hardhat";

const {
  anyValue,
} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
describe("Auction House Tests", function () {
  let accounts: { address: any }[];
  let mockToken: BaseContract & {
    deploymentTransaction(): ContractTransactionResponse;
  } & Omit<BaseContract, keyof BaseContract>;
  let nft: BaseContract & {
    deploymentTransaction(): ContractTransactionResponse;
  } & Omit<BaseContract, keyof BaseContract>;
  let auctionHouse: BaseContract & {
    deploymentTransaction(): ContractTransactionResponse;
  } & Omit<BaseContract, keyof BaseContract>;
  let mockTokenAddress: string;
  let nftAddress: string;
  let auctionHouseAddress: string;

  before(async function () {
    accounts = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("mock_erc20");

    mockToken = await MockToken.deploy("Mock Token", "MTK", 18);
    await mockToken.waitForDeployment();
    mockTokenAddress = await mockToken.getAddress();
    console.log("Mock Token deployed to:", mockTokenAddress);

    const NFT = await ethers.getContractFactory("nft");

    nft = await NFT.deploy(
      "ENNEFFTEE",
      "TEST",
      "https://test.url",
      "ENEFFTEE",
      "1",
      { from: accounts[0].address }
    );
    await nft.waitForDeployment();
    nftAddress = await nft.getAddress();

    console.log("NFT deployed to:", nftAddress);

    const AuctionHouse = await ethers.getContractFactory("auction");

    auctionHouse = await AuctionHouse.deploy(
      mockTokenAddress,
      nftAddress,
      50,
      { from: accounts[0].address }
    );
    await auctionHouse.waitForDeployment();
    await auctionHouse.set_auctioneer(accounts[0].address);

    auctionHouseAddress = await auctionHouse.getAddress();
    await nft.set_minter(auctionHouseAddress, true, {
      from: accounts[0].address,
    });
    console.log("Auction House deployed to:", auctionHouseAddress);
  });

  describe("Auction tests", function () {
    it("Should handle auction settlement and token balances correctly & withdraw proceeds", async function () {
      // Setup token and auction details
      await nft.safe_mint(accounts[0].address, "http://memes.org");
      const tokenId = (await nft._counter()) - 1n;

      await nft.approve(auctionHouseAddress, tokenId, {
        from: accounts[0].address,
      });

      // Start the auction
      await auctionHouse.start_auction(tokenId, accounts[3].address, {
        from: accounts[0].address,
      });

      // Accounts[1] will place a bid
      await mockToken
        .connect(accounts[1])
        .mint(accounts[1].address, ethers.parseUnits("1000", 18));
      await mockToken
        .connect(accounts[1])
        .approve(auctionHouseAddress, ethers.parseUnits("1000", 18), {
          from: accounts[1].address,
        });

      const initialBidderBalance = await mockToken.balanceOf(
        accounts[1].address
      );
      const initialAuctionHouseBalance = await mockToken.balanceOf(
        auctionHouseAddress
      );
      const initialPatronBalance = await mockToken.balanceOf(
        accounts[3].address
      );

      // Place the bid
      await auctionHouse
        .connect(accounts[1])
        .bid(ethers.parseUnits("1000", 18), tokenId, {
          from: accounts[1].address,
        });

      // Advance time to simulate auction ending
      await ethers.provider.send("evm_increaseTime", [86400 * 5]); // Advance time by 5 days
      await ethers.provider.send("evm_mine"); // Mine the next block

      // End the auction
      await auctionHouse.end(tokenId);

      const finalBidderBalance = await mockToken.balanceOf(
        accounts[1].address
      );
      const finalAuctionHouseBalance = await mockToken.balanceOf(
        auctionHouseAddress
      );
      const finalPatronBalance = await mockToken.balanceOf(
        accounts[3].address
      );

      const bidAmount = ethers.parseUnits("1000", 18);
      const feeAmount = (bidAmount * 50n) / 100000n; // Assuming a fee of 0.05%
      const expectedPatronProceeds = bidAmount - feeAmount;

      expect(finalBidderBalance).to.equal(
        initialBidderBalance - bidAmount,
        "Bidder's balance should decrease by the bid amount"
      );
      expect(finalAuctionHouseBalance).to.equal(
        initialAuctionHouseBalance + feeAmount,
        "Auction House's balance should increase by the fee amount"
      );
      expect(finalPatronBalance).to.equal(
        initialPatronBalance + expectedPatronProceeds,
        "Patron's balance should increase by the proceeds after fee"
      );

      await auctionHouse.withdraw_proceeds(accounts[0], {
        from: accounts[0].address,
      });

      const finalAdminBalance = await mockToken.balanceOf(
        accounts[0].address
      );

      expect(finalAdminBalance).to.equal(
        feeAmount,
        "Withdraw_Proceeds should match the preceding auctions fee"
      );
    });

    it("Should handle auction time and bidding correctly", async function () {
      // Setup token and auction details
      await mockToken.mint(
        accounts[0].address,
        ethers.parseUnits("100000", 18)
      );
      await mockToken.approve(
        auctionHouseAddress,
        ethers.parseUnits("100000", 18),
        { from: accounts[0].address }
      );

      await nft.safe_mint(accounts[0].address, "http://memes.org");
      const tokenId = (await nft._counter()) - 1n;

      expect(await nft.ownerOf(tokenId)).to.equal(
        accounts[0].address
      );

      await nft.approve(auctionHouseAddress, tokenId, {
        from: accounts[0].address,
      });
      await auctionHouse.start_auction(tokenId, accounts[3].address, {
        from: accounts[0].address,
      });

      // Advance time to simulate auction ending
      await ethers.provider.send("evm_increaseTime", [
        86400 * 5 - 300,
      ]); // Advance time by almost 5 days
      await ethers.provider.send("evm_mine"); // Mine the next block

      const endTime = await auctionHouse.auction_ends(tokenId);
      await auctionHouse.bid(BigInt(500 * 2 * 10 ** 18), tokenId, {
        from: accounts[0].address,
      });
      const extendedEndTime = await auctionHouse.auction_ends(
        tokenId
      );

      expect(extendedEndTime).to.be.gt(endTime);
    });

    it("Should handle automatic auction start correctly during mint_and_start_auction", async function () {
      // Setup token and auction details
      await mockToken.mint(
        accounts[0].address,
        ethers.parseUnits("100000", 18)
      );
      await mockToken.approve(
        auctionHouseAddress,
        ethers.parseUnits("100000", 18),
        { from: accounts[0].address }
      );

      const gasTx = await auctionHouse.mint_and_start_auction(
        "http://",
        accounts[3].address,
        nftAddress,
        { from: accounts[0].address }
      );
      const receipt = await gasTx.wait();

      const tokenId = (await nft._counter()) - 1n;

      expect(await nft.ownerOf(tokenId)).to.equal(
        auctionHouseAddress
      );

      // Advance time to simulate auction ending
      await ethers.provider.send("evm_increaseTime", [
        86400 * 5 - 3000,
      ]); // Advance time by almost 5 days
      await ethers.provider.send("evm_mine"); // Mine the next block

      const endTime = await auctionHouse.auction_ends(tokenId);
      await auctionHouse.bid(BigInt(500 * 2 * 10 ** 18), tokenId, {
        from: accounts[0].address,
      });
      const extendedEndTime = await auctionHouse.auction_ends(
        tokenId
      );

      expect(extendedEndTime).to.be.gt(endTime);
    });

    it("Should handle relisting auctions for NFTs held by the auction house after an unsuccessful auction", async function () {
      // Mint and start an auction
      await mockToken.mint(
        accounts[0].address,
        ethers.parseUnits("10000", 18)
      );
      await mockToken.approve(
        auctionHouseAddress,
        ethers.parseUnits("10000", 18),
        { from: accounts[0].address }
      );

      // Simulate minting directly to the auction house and starting an auction
      await auctionHouse.mint_and_start_auction(
        "http://example-nft.org",
        accounts[0].address,
        nftAddress,
        { from: accounts[0].address }
      );
      const tokenId = (await nft._counter()) - 1n;

      // Verify the auction is initially active
      let auctionEndTime = await auctionHouse.auction_ends(tokenId);
      expect(auctionEndTime).to.be.gt(
        0,
        "Auction should be initially active"
      );

      // Move time forward past the initial auction duration
      await ethers.provider.send("evm_increaseTime", [86400 * 6]);
      await ethers.provider.send("evm_mine");

      // End the initial auction, which should be unsuccessful due to no bids
      await auctionHouse.end(tokenId);
      auctionEndTime = await auctionHouse.auction_ends(tokenId);
      expect(auctionEndTime).to.equal(
        0,
        "Auction should be marked as ended"
      );

      // Relist the auction since it was unsuccessful
      await auctionHouse.start_auction_with_auctionhouse_held_nft(
        tokenId,
        accounts[0].address
      );

      // Verify the auction has been restarted
      auctionEndTime = await auctionHouse.auction_ends(tokenId);
      expect(auctionEndTime).to.be.gt(
        0,
        "Auction should be reactivated"
      );

      // Verify the auction house still owns the NFT
      expect(await nft.ownerOf(tokenId)).to.equal(
        auctionHouseAddress,
        "Auction House should still own the NFT"
      );
    });

    it("Should handle multiple consecutive bids correctly", async function () {
      await mockToken.mint(
        accounts[0].address,
        ethers.parseUnits("1000000", 18)
      );
      await mockToken.approve(
        auctionHouseAddress,
        ethers.parseUnits("1000000", 18),
        { from: accounts[0].address }
      );

      // Starting the auction
      await nft.safe_mint(
        accounts[0].address,
        "http://unique-nft.com"
      );
      const tokenId = (await nft._counter()) - 1n;
      await nft.approve(auctionHouseAddress, tokenId, {
        from: accounts[0].address,
      });
      await auctionHouse.start_auction(tokenId, accounts[0].address, {
        from: accounts[0].address,
      });

      // First bid by account 1
      await mockToken
        .connect(accounts[1])
        .mint(accounts[1].address, ethers.parseUnits("100000", 18));

      await mockToken
        .connect(accounts[1])
        .approve(
          auctionHouseAddress,
          ethers.parseUnits("100000", 18)
        );
      await auctionHouse
        .connect(accounts[1])
        .bid(ethers.parseUnits("1000", 18), tokenId);

      // Second bid by account 2, higher than first
      await mockToken
        .connect(accounts[2])
        .mint(accounts[2].address, ethers.parseUnits("100000", 18));
      await mockToken
        .connect(accounts[2])
        .approve(
          auctionHouseAddress,
          ethers.parseUnits("100000", 18)
        );
      await auctionHouse
        .connect(accounts[2])
        .bid(ethers.parseUnits("1100", 18), tokenId);

      // Verify the highest bidder is now account 2
      const topBid = await auctionHouse.topBid(tokenId);
      expect(topBid.bidder).to.equal(accounts[2].address);
      expect(topBid.bid).to.equal(ethers.parseUnits("1100", 18));
    });
  });

  describe("Auction House Event Tests", function () {
    it("Should emit events correctly for starting an auction, placing a bid, and ending an auction", async function () {
      await nft.safe_mint(accounts[0].address, "http://memes.org");
      const tokenId = (await nft._counter()) - 1n;
      await nft.approve(auctionHouseAddress, tokenId, {
        from: accounts[0].address,
      });

      // Start Auction

      await ethers.provider.send("evm_mine"); // mine the next block to reflect the time change

      await expect(
        auctionHouse.start_auction(tokenId, accounts[0].address, {
          from: accounts[0].address,
        })
      ).to.emit(auctionHouse, "AuctionStarted");

      // Place Bid
      // First, the account places some funds and approves them for the bid
      await mockToken
        .connect(accounts[1])
        .mint(accounts[1].address, ethers.parseUnits("2000", 18));
      await mockToken
        .connect(accounts[1])
        .approve(auctionHouseAddress, ethers.parseUnits("2000", 18), {
          from: accounts[1].address,
        });

      await expect(
        auctionHouse
          .connect(accounts[1])
          .bid(ethers.parseUnits("1000", 18), tokenId)
      )
        .to.emit(auctionHouse, "BidSubmitted")
        .withArgs(
          tokenId.toString(),
          accounts[1].address,
          ethers.parseUnits("1000", 18).toString(),
          anyValue
        );

      // End Auction
      // Simulate the passage of auction duration time correctly
      await ethers.provider.send("evm_increaseTime", [86400 * 5]);
      await ethers.provider.send("evm_mine");
      await expect(auctionHouse.end(tokenId))
        .to.emit(auctionHouse, "AuctionEnded")
        .withArgs(
          tokenId.toString(),
          accounts[1].address,
          BigInt(1000e18 - 0.5e18)
        );
    });
  });

  describe("Admin functions", function () {
    it("Should set the right owner", async function () {
      expect(await auctionHouse.owner()).to.equal(
        accounts[0].address
      );
    });

    it("Should handle ownership and auction settings correctly", async function () {
      expect(await auctionHouse.nft()).to.equal(nftAddress);
      expect(await auctionHouse.bid_token()).to.equal(
        mockTokenAddress
      );
      expect(await auctionHouse.owner()).to.equal(
        accounts[0].address
      );
      expect(await auctionHouse.fee()).to.equal(50);

      // Transfer ownership
      await auctionHouse.transfer_ownership(accounts[4].address, {
        from: accounts[0].address,
      });
      expect(await auctionHouse.owner()).to.equal(
        accounts[4].address
      );

      // Should revert if the same account tries to transfer ownership again without being owner
      await expect(
        auctionHouse.transfer_ownership(accounts[0].address, {
          from: accounts[0].address,
        })
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Should revert trying to transfer to the zero address
      await expect(
        auctionHouse
          .connect(accounts[4])
          .transfer_ownership(
            "0x0000000000000000000000000000000000000000"
          )
      ).to.be.revertedWith("Ownable: new owner is the zero address");

      // Transfer ownership
      await auctionHouse
        .connect(accounts[4])
        .transfer_ownership(accounts[0].address, {
          from: accounts[4].address,
        });
      expect(await auctionHouse.owner()).to.equal(
        accounts[0].address
      );
    });
    it("Should allow admin to change fee and auction duration", async function () {
      await auctionHouse.change_fee(100, {
        from: accounts[0].address,
      });
      expect(await auctionHouse.fee()).to.equal(100);

      await expect(
        auctionHouse
          .connect(accounts[4])
          .change_fee(101, { from: accounts[4].address })
      ).to.be.reverted;

      await auctionHouse.change_auction_duration(86400 * 7, {
        from: accounts[0].address,
      });
      expect(await auctionHouse.auction_duration()).to.equal(
        86400 * 7
      );
      await auctionHouse.change_auction_duration(86400 * 5, {
        from: accounts[0].address,
      });
      expect(await auctionHouse.auction_duration()).to.equal(
        86400 * 5
      );
    });

    it("Should allow admin to change minimum bid increment percentage", async function () {
      const newMinBidIncrementPercentage = 110;

      // Change the percentage using the owner account
      await auctionHouse.change_minimum_bid_increment_percentage(
        newMinBidIncrementPercentage,
        {
          from: accounts[0].address,
        }
      );

      // Verify the change
      expect(
        await auctionHouse.minimum_bid_increment_percentage()
      ).to.equal(newMinBidIncrementPercentage);

      // Attempt to change using a non-owner account and expect a revert
      await expect(
        auctionHouse
          .connect(accounts[4])
          .change_minimum_bid_increment_percentage(120, {
            from: accounts[4].address,
          })
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow admin to change extension time in seconds", async function () {
      const newExtensionTimeSeconds = 7200;

      // Change the extension time using the owner account
      await auctionHouse.change_extension_time_seconds(
        newExtensionTimeSeconds,
        { from: accounts[0].address }
      );

      // Verify the change
      expect(await auctionHouse.extension_time_seconds()).to.equal(
        newExtensionTimeSeconds
      );

      // Attempt to change using a non-owner account and expect a revert
      await expect(
        auctionHouse
          .connect(accounts[4])
          .change_extension_time_seconds(3600, {
            from: accounts[4].address,
          })
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow admin to change starting bid", async function () {
      const newStartingBid = ethers.parseUnits("2000", 18);

      // Change the starting bid using the owner account
      await auctionHouse.change_starting_bid(newStartingBid, {
        from: accounts[0].address,
      });

      // Verify the change
      expect(await auctionHouse.starting_bid()).to.equal(
        newStartingBid
      );

      // Attempt to change using a non-owner account and expect a revert
      await expect(
        auctionHouse
          .connect(accounts[4])
          .change_starting_bid(ethers.parseUnits("3000", 18), {
            from: accounts[4].address,
          })
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

describe("NFT Contract Tests", function () {
  let accounts: { address: any }[];
  let mockToken: BaseContract & {
    deploymentTransaction(): ContractTransactionResponse;
  } & Omit<BaseContract, keyof BaseContract>;
  let nft: BaseContract & {
    deploymentTransaction(): ContractTransactionResponse;
  } & Omit<BaseContract, keyof BaseContract>;
  let auctionHouse: BaseContract & {
    deploymentTransaction(): ContractTransactionResponse;
  } & Omit<BaseContract, keyof BaseContract>;
  let mockTokenAddress: string;
  let nftAddress: string;
  let auctionHouseAddress: string;

  before(async function () {
    accounts = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("mock_erc20");

    mockToken = await MockToken.deploy("Mock Token", "MTK", 18);
    await mockToken.waitForDeployment();
    mockTokenAddress = await mockToken.getAddress();
    console.log("Mock Token deployed to:", mockTokenAddress);

    const NFT = await ethers.getContractFactory("nft");

    nft = await NFT.deploy(
      "ENNEFFTEE",
      "TEST",
      "https://test.url",
      "ENEFFTEE",
      "1",
      { from: accounts[0].address }
    );
    await nft.waitForDeployment();
    nftAddress = await nft.getAddress();

    console.log("NFT deployed to:", nftAddress);

    const AuctionHouse = await ethers.getContractFactory("auction");

    auctionHouse = await AuctionHouse.deploy(
      mockTokenAddress,
      nftAddress,
      50,
      { from: accounts[0].address }
    );
    await auctionHouse.waitForDeployment();
    await auctionHouse.set_auctioneer(accounts[0].address);

    auctionHouseAddress = await auctionHouse.getAddress();
    await nft.set_minter(auctionHouseAddress, true, {
      from: accounts[0].address,
    });
    console.log("Auction House deployed to:", auctionHouseAddress);
  });

  it("Should allow setting and revoking minter role", async function () {
    const tokenId = await nft._counter();

    await expect(nft.set_minter(accounts[2].address, true))
      .to.emit(nft, "RoleMinterChanged")
      .withArgs(accounts[2].address, true);

    // Try minting from a new minter
    await expect(
      nft
        .connect(accounts[2])
        .safe_mint(accounts[2].address, "https://new.uri")
    )
      .to.emit(nft, "Transfer")
      .withArgs(ethers.ZeroAddress, accounts[2].address, tokenId);

    // Revoke minter role
    await expect(nft.set_minter(accounts[2].address, false))
      .to.emit(nft, "RoleMinterChanged")
      .withArgs(accounts[2].address, false);
  });

  it("Should burn an NFT", async function () {
    const totalSupplyStart = await nft.totalSupply();
    const tokenId = await nft._counter();
    // Mint token first
    await nft.safe_mint(accounts[0].address, "https://token.uri/2");

    // Burn token
    await expect(nft.burn(tokenId))
      .to.emit(nft, "Transfer")
      .withArgs(accounts[0].address, ethers.ZeroAddress, tokenId);
    const totalSupply = await nft.totalSupply();

    expect(totalSupply).to.equal(totalSupplyStart); // tokenSupply should be equal to before the mint.
  });

  it("Should transfer ownership and update minter status", async function () {
    await expect(
      nft.transfer_ownership_and_minter(accounts[3].address)
    )
      .to.emit(nft, "OwnershipTransferred")
      .withArgs(accounts[0].address, accounts[3].address);

    // Verify new owner can set minter
    await expect(
      nft.connect(accounts[3]).set_minter(accounts[4].address, true)
    )
      .to.emit(nft, "RoleMinterChanged")
      .withArgs(accounts[4].address, true);
  });
});
