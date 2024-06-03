import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-vyper";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  vyper: {
    version: "0.3.10",
  },
  networks: {
    basesepolia: {
      url:
        process.env.SEPOLIA_URL ||
        "https://base-sepolia-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 84532,
    },
    arbitrumSepolia: {
      url:
        process.env.ARBITRUM_SEPOLIA_URL ||
        "https://arbitrum-sepolia.blockpi.network/v1/rpc/public",
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 421614,
    },
  },
};

export default config;
