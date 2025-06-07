import Web3 from "web3";
import DiamondNFT from "../../../blockchain/build/contracts/DiamondNFT.json";

const CONTRACT_ADDRESS = "0xbc4d1251145d4ace1e7256b8e68d8736c89b5023817f38b59713813b0a3e4913";
let web3
let contract;

const initWeb3 = async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
    const accounts = await web3.eth.getAccounts();
    contract = new web3.eth.Contract(DiamondNFT.abi, CONTRACT_ADDRESS);
    return { web3, accounts, contract };
  } else {
    alert("Please install MetaMask to use this app");
  }
};

export default initWeb3;
