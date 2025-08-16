module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
      from: "0x116A325d04c00D69595e4c8D066B118fB1a44531",
      gas: 6721975,          // Gas limit
      gasPrice: 20000000000, // 20 gwei (in wei)
    },
  },

  mocha: {
    timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.20",  
      settings: {             
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "london",  
        viaIR: true           
      }
    }
  }
};