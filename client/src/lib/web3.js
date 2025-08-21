import Web3 from "web3";
import DiamondNFT from "../../../blockchain/build/contracts/DiamondNFT.json";
import DiamondLending from "../../../blockchain/build/contracts/DiamondLending.json";
import contractAddresses from './contract-addresses.json';

const CONTRACT_ADDRESSES = contractAddresses;

// Ganache network configuration
const GANACHE_NETWORK = {
  chainId: '0x539', // 1337 in hex
  chainName: 'Ganache Local',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['http://localhost:7545'],
  blockExplorerUrls: []
};

let web3;
let contracts = {};

const initWeb3 = async () => {
  if (window.ethereum) {
    try {
      web3 = new Web3(window.ethereum);
      
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      
      // Check if we're on the correct network
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      
      if (chainId !== GANACHE_NETWORK.chainId) {
        console.log("Switching to Ganache network...");
        await switchToGanacheNetwork();
      }
      
      // Initialize contracts
      contracts.diamondNFT = new web3.eth.Contract(DiamondNFT.abi, CONTRACT_ADDRESSES.diamondNFT);
      contracts.diamondLending = new web3.eth.Contract(DiamondLending.abi, CONTRACT_ADDRESSES.diamondLending);
      
      return { web3, accounts, contracts };
    } catch (error) {
      console.error("Error initializing Web3:", error);
      throw error;
    }
  } else {
    alert("Please install MetaMask to use this app");
    throw new Error("MetaMask not installed");
  }
};

const switchToGanacheNetwork = async () => {
  try {
    // Try to switch to the Ganache network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: GANACHE_NETWORK.chainId }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [GANACHE_NETWORK],
        });
      } catch (addError) {
        console.error("Failed to add Ganache network to MetaMask:", addError);
        throw new Error("Please add Ganache network to MetaMask manually");
      }
    } else {
      throw switchError;
    }
  }
};

// Listen for network changes
if (window.ethereum) {
  window.ethereum.on('chainChanged', (chainId) => {
    console.log("Network changed to:", chainId);
    // Reload the page when network changes
    window.location.reload();
  });
  
  window.ethereum.on('accountsChanged', (accounts) => {
    console.log("Account changed to:", accounts[0]);
    // Reload the page when account changes
    window.location.reload();
  });
}

export default initWeb3;
export { contracts, GANACHE_NETWORK };

// Add this function for debugging
export const testConnection = async () => {
  try {
    const { web3, accounts, contracts } = await initWeb3();
    console.log("Connected accounts:", accounts);
    console.log("Network ID:", await web3.eth.net.getId());
    console.log("Contracts loaded:", Object.keys(contracts));
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};
