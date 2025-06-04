// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DiamondNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    
    // Mapping from certificate number to token ID (to prevent duplicates)
    mapping(string => uint256) public certificateToTokenId;
    mapping(uint256 => string) public tokenIdToCertificate;
    
    // Mapping for token URIs (replacing ERC721URIStorage functionality)
    mapping(uint256 => string) private _tokenURIs;
    
    // Only the DiamondLending contract can mint
    address public diamondLendingContract;
    
    event DiamondMinted(uint256 indexed tokenId, address indexed owner, string certificateNumber);
    
    modifier onlyDiamondLending() {
        require(msg.sender == diamondLendingContract, "Only DiamondLending contract can call");
        _;
    }
    
    constructor(address initialOwner) ERC721("DiamondZone", "DMND") Ownable(initialOwner) {
        _nextTokenId = 1; // Start token IDs at 1
    }
    
    // Set the DiamondLending contract address (only owner can set)
    function setDiamondLendingContract(address _diamondLendingContract) external onlyOwner {
        diamondLendingContract = _diamondLendingContract;
    }
    
    // Mint a new diamond NFT (only callable by DiamondLending contract)
    function mintDiamond(address _to, string memory _certificateNumber) 
        external 
        onlyDiamondLending 
        returns (uint256) 
    {
        require(bytes(_certificateNumber).length > 0, "Certificate number required");
        require(certificateToTokenId[_certificateNumber] == 0, "Certificate already exists");
        
        uint256 tokenId = _nextTokenId++;
        
        certificateToTokenId[_certificateNumber] = tokenId;
        tokenIdToCertificate[tokenId] = _certificateNumber;
        
        _mint(_to, tokenId);
        
        emit DiamondMinted(tokenId, _to, _certificateNumber);
        return tokenId;
    }
    
    // Set token URI (only owner or DiamondLending contract)
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external {
        require(msg.sender == owner() || msg.sender == diamondLendingContract, "Not authorized");
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    // Override tokenURI to use our custom mapping
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();
        
        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via string.concat).
        if (bytes(_tokenURI).length > 0) {
            return string.concat(base, _tokenURI);
        }
        
        return super.tokenURI(tokenId);
    }
    
    // Get token ID by certificate number
    function getTokenIdByCertificate(string memory _certificateNumber) 
        external 
        view 
        returns (uint256) 
    {
        return certificateToTokenId[_certificateNumber];
    }
    
    // Check if certificate exists
    function certificateExists(string memory _certificateNumber) 
        external 
        view 
        returns (bool) 
    {
        return certificateToTokenId[_certificateNumber] != 0;
    }
}