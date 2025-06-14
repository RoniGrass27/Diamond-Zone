const DiamondNFT = artifacts.require("DiamondNFT");
const DiamondLending = artifacts.require("DiamondLending");

module.exports = async function(deployer, network, accounts) {
  // Deploy DiamondNFT first (with owner address)
  await deployer.deploy(DiamondNFT, accounts[0]);
  const diamondNFT = await DiamondNFT.deployed();
  
  // Deploy DiamondLending (with NFT contract address)
  await deployer.deploy(DiamondLending, diamondNFT.address);
  const diamondLending = await DiamondLending.deployed();
  
  // Connect the contracts
  await diamondNFT.setDiamondLendingContract(diamondLending.address);
  
  const metaMaskAddress = "0x56a6fa69ED2Dc65F1C0F6be0eE802e55dC4Aa520";

  console.log("DiamondNFT deployed at:", diamondNFT.address);
  console.log("DiamondLending deployed at:", diamondLending.address);
};