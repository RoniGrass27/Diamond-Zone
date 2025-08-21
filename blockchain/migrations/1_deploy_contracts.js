const DiamondNFT = artifacts.require("DiamondNFT");
const DiamondLending = artifacts.require("DiamondLending");
const fs = require('fs');
const path = require('path');

module.exports = async function(deployer, network, accounts) {
  try {
    console.log('Starting contract deployment...');
    const deployerAccount = accounts[0];
    console.log('Deploying from account:', deployerAccount);
    
    // Step 1: Deploy DiamondNFT with deployer as initial owner
    await deployer.deploy(DiamondNFT, deployerAccount);
    const diamondNFT = await DiamondNFT.deployed();
    console.log('✅ DiamondNFT deployed at:', diamondNFT.address);
    
    // Step 2: Deploy DiamondLending with DiamondNFT address
    await deployer.deploy(DiamondLending, diamondNFT.address);
    const diamondLending = await DiamondLending.deployed();
    console.log('✅ DiamondLending deployed at:', diamondLending.address);
    
    // Step 3: Set the DiamondLending contract address in DiamondNFT
    await diamondNFT.setDiamondLendingContract(diamondLending.address);
    console.log('✅ DiamondNFT linked to DiamondLending');
    
    // Step 4: Update frontend addresses
    const addresses = {
      diamondNFT: diamondNFT.address,
      diamondLending: diamondLending.address
    };
    
    // FIXED: Correct path to client folder
    const filePath = path.join(__dirname, '../../client/src/lib/contract-addresses.json');
    
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the addresses to the JSON file
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
    
    console.log('✅ Contract addresses updated in frontend:', addresses);
    console.log('✅ File created at:', filePath);
    console.log('🎉 Deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};