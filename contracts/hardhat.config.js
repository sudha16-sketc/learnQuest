require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../../.env" });

const PRIVATE_KEY = process.env.REWARD_SIGNER_PRIVATE_KEY || "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
const MST_RPC_URL = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";
const MST_CHAIN_ID = Number(process.env.MST_CHAIN_ID || 91562037);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "cancun"
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    mstTestnet: {
      url: MST_RPC_URL,
      chainId: MST_CHAIN_ID,
      accounts: [PRIVATE_KEY]
    },
    mstMainnet: {
      url: process.env.MST_MAINNET_RPC_URL || "https://mariorpc.mstblockchain.com",
      chainId: 4646,
      accounts: [PRIVATE_KEY]
    }
  }
};
