var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" 
    },
    development1: {
      provider: function () {
        var wallet = new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
        return wallet
      },
      network_id: '*',
    }
  },
  compilers: {
    solc: {
      version: "^0.5.0"
    }
  }
};