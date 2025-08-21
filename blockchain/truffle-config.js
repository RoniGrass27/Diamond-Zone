module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost
      port: 7545,            // Ganache default port
      network_id: "*",       // Match any network id
      gas: 6721975,          // Gas limit
      gasPrice: 20000000000, // 20 gwei (Ganache default)
      skipDryRun: true,      // Skip dry run for faster deployment
      confirmations: 0       // No confirmations needed for local network
    }
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