const HDWalletProvider = require('@truffle/hdwallet-provider')
require('dotenv').config()
module.exports = {
  networks: {
    fuji: {
      provider: () => {
        return new HDWalletProvider({
          mnemonic: process.env.MNEMONIC,
          providerOrUrl: `https://avalanche-fuji.infura.io/v3/${process.env.APIKEY}`,
          chainId: '43113'
        })
      },
      network_id: "*",
      gasPrice: 225000000000
    },
    mainnet: {
      provider: () => {
        return new HDWalletProvider({
          mnemonic: process.env.MNEMONIC,
          providerOrUrl: `https://api.avax.network/ext/bc/C/rpc`,
          chainId: '43114',
        })
      },
      network_id: "*",
      gasPrice: 225000000000
    }
  },
  compilers: {
    solc: {
      version: "0.8.6"
    }
  },
  plugins: ["solidity-coverage", "truffle-contract-size", "truffle-plugin-verify"],
  api_keys: {
    etherscan: process.env.etherscanApiKey,
    snowtrace: process.env.snowtraceApiKey
  }
};