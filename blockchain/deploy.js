// blockchain/working-deploy.js - Working deployment script
const Web3 = require('web3').default;
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

class ContractDeployer {
  constructor() {
    this.web3 = new Web3(process.env.QUORUM_RPC_URL || 'http://localhost:7545');
    this.deployer = null;
  }

  async init() {
    try {
      // Get deployer account
      const accounts = await this.web3.eth.getAccounts();
      this.deployer = accounts[0];
      
      if (!this.deployer) {
        throw new Error('No deployer account found');
      }

      console.log('Starting deployment...');
      console.log('Deployer account:', this.deployer);
      console.log('Network ID:', await this.web3.eth.net.getId());
      
      const balance = await this.web3.eth.getBalance(this.deployer);
      console.log('Deployer balance:', this.web3.utils.fromWei(balance, 'ether'), 'ETH');
      
    } catch (error) {
      console.error('Failed to initialize deployer:', error);
      throw error;
    }
  }

  async loadCompiledContract(contractName) {
    try {
      // Try to load from Truffle build directory
      const buildPath = path.join(__dirname, 'build', 'contracts', `${contractName}.json`);
      
      if (fs.existsSync(buildPath)) {
        const contractJson = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
        return {
          abi: contractJson.abi,
          bytecode: contractJson.bytecode
        };
      } else {
        throw new Error(`Contract ${contractName} not found in build directory. Run 'npx truffle compile' first.`);
      }
    } catch (error) {
      console.error(`Error loading contract ${contractName}:`, error.message);
      throw error;
    }
  }

  async deployContract(contractName, constructorArgs = []) {
    try {
      console.log(`\nDeploying ${contractName}...`);
      
      const contractData = await this.loadCompiledContract(contractName);
      const contract = new this.web3.eth.Contract(contractData.abi);
      
      const deployTx = contract.deploy({
        data: contractData.bytecode,
        arguments: constructorArgs
      });

      const gasEstimate = await deployTx.estimateGas({ from: this.deployer });
      console.log(`Estimated gas: ${gasEstimate}`);

      const deployedContract = await deployTx.send({
        from: this.deployer,
        gas: gasEstimate + 100000, // Add buffer
        gasPrice: process.env.GAS_PRICE || '0'
      });

      console.log(`${contractName} deployed to: ${deployedContract.options.address}`);
      
      return {
        address: deployedContract.options.address,
        abi: contractData.abi,
        contract: deployedContract
      };
      
    } catch (error) {
      console.error(`Error deploying ${contractName}:`, error);
      throw error;
    }
  }

  async deployAll() {
    try {
      await this.init();
      
      console.log('\n' + '='.repeat(50));
      console.log('Starting Diamond Zone Contract Deployment');
      console.log('='.repeat(50));

      // Deploy DiamondNFT first
      const diamondNFT = await this.deployContract('DiamondNFT', [this.deployer]);
      //return;

      // Deploy DiamondLending with NFT address
      const diamondLending = await this.deployContract('DiamondLending', [diamondNFT.address]);
      
      // Set DiamondLending address in DiamondNFT
      console.log('\nLinking contracts...');
      const setLendingTx = diamondNFT.contract.methods.setDiamondLendingContract(diamondLending.address);
      const gasEstimate = await setLendingTx.estimateGas({ from: this.deployer });
      
      await setLendingTx.send({
        from: this.deployer,
        gas: gasEstimate,
        gasPrice: process.env.GAS_PRICE || '0'
      });
      
      console.log('Contracts linked successfully');

      // Save deployment info
      const deploymentInfo = {
        network: process.env.QUORUM_RPC_URL || 'http://localhost:8545',
        networkId: await this.web3.eth.net.getId(),
        deployer: this.deployer,
        deployedAt: new Date().toISOString(),
        contracts: {
          DiamondNFT: {
            address: diamondNFT.address,
            abi: diamondNFT.abi
          },
          DiamondLending: {
            address: diamondLending.address,
            abi: diamondLending.abi
          }
        }
      };

      // Save to file
      const deploymentFile = path.join(__dirname, 'deployment.json');
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

      // Create ABI files for server to use
      const abisDir = path.join(__dirname, 'abis');
      if (!fs.existsSync(abisDir)) {
        fs.mkdirSync(abisDir);
      }
      
      fs.writeFileSync(
        path.join(abisDir, 'DiamondNFT.json'), 
        JSON.stringify(diamondNFT.abi, null, 2)
      );
      
      fs.writeFileSync(
        path.join(abisDir, 'DiamondLending.json'), 
        JSON.stringify(diamondLending.abi, null, 2)
      );

      // After deployment, copy addresses to frontend
      const updateFrontendAddresses = () => {
        const diamondNFT = artifacts.require("DiamondNFT");
        const diamondLending = artifacts.require("DiamondLending");
        
        const addresses = {
          diamondNFT: diamondNFT.address,
          diamondLending: diamondLending.address
        };
        
        // Write to a JSON file that frontend can read
        fs.writeFileSync(
          path.join(__dirname, '../client/src/contract-addresses.json'),
          JSON.stringify(addresses, null, 2)
        );
        
        console.log('Contract addresses updated:', addresses);
      };

      console.log('\n' + '='.repeat(50));
      console.log('Deployment completed successfully!');
      console.log('='.repeat(50));
      console.log(`DiamondNFT: ${diamondNFT.address}`);
      console.log(`DiamondLending: ${diamondLending.address}`);
      console.log(`Deployment info: ${deploymentFile}`);
      console.log(`ABIs saved to: ${abisDir}`);
      
      console.log('\nNext steps:');
      console.log('1. Update your server/.env file with:');
      console.log(`   DIAMOND_NFT_ADDRESS=${diamondNFT.address}`);
      console.log(`   DIAMOND_LENDING_ADDRESS=${diamondLending.address}`);
      console.log('2. Restart your server');
      console.log('3. Test the blockchain features in your app');
      
      return deploymentInfo;
      
    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  }

  // NEW: Add this method to update frontend addresses
  async updateFrontendAddresses(diamondNFTAddress, diamondLendingAddress) {
    try {
      const addresses = {
        diamondNFT: diamondNFTAddress,
        diamondLending: diamondLendingAddress
      };
      
      // Create the file path
      const filePath = path.join(__dirname, '../client/src/lib/contract-addresses.json');
      
      // Write the addresses to the JSON file
      fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
      
      console.log('✅ Contract addresses updated in frontend:', addresses);
      console.log('✅ File created at:', filePath);
    } catch (error) {
      console.error('❌ Failed to update frontend addresses:', error);
      throw error;
    }
  }
}

// Run deployment
async function main() {
  try {
    const deployer = new ContractDeployer();
    await deployer.deployAll();
    process.exit(0);
  } catch (error) {
    console.error('Deployment script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ContractDeployer;