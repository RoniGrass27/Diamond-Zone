// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DiamondNFT.sol";

contract DiamondLending {
    
    // Enums for loan status
    enum LoanStatus { PENDING, ACTIVE, SOLD, RETURNED, CANCELLED }
    enum OfferStatus { PENDING, ACCEPTED, REJECTED, EXPIRED }
    
    // Struct for Diamond details
    struct Diamond {
        uint256 tokenId;
        string certificateNumber;
        uint256 weight; // in carats (multiplied by 100 for precision)
        string shape;
        string color;
        string clarity;
        string cut;
        string polish;
        string symmetry;
        string uv;
        uint256 cost; // in wei or smallest unit
        string supplier;
        uint256 buyingDate;
        uint256 expenses;
        address owner;
        bool isAvailable;
    }
    
    // Struct for Loan Agreement
    struct LoanAgreement {
        uint256 loanId;
        uint256 diamondTokenId;
        address borrower;
        address lender;
        uint256 loanDuration; // in days
        uint256 createdAt;
        uint256 approvedAt;
        LoanStatus status;
        string terms; // Additional terms
        bytes32 qrCodeHash; // Hash of QR code data
    }
    
    // Struct for Sale Offer
    struct SaleOffer {
        uint256 offerId;
        uint256 loanId;
        address buyer;
        uint256 offerAmount;
        uint256 createdAt;
        uint256 expiresAt;
        OfferStatus status;
        string message;
    }
    
    // State variables
    DiamondNFT public diamondNFT;
    uint256 public nextLoanId = 1;
    uint256 public nextOfferId = 1;
    
    // Mappings
    mapping(uint256 => Diamond) public diamonds;
    mapping(uint256 => LoanAgreement) public loans;
    mapping(uint256 => SaleOffer) public offers;
    mapping(address => uint256[]) public userLoans;
    mapping(address => uint256[]) public userOffers;
    mapping(uint256 => uint256[]) public loanOffers; // loanId => offerIds[]
    
    // Events
    event DiamondAdded(uint256 indexed tokenId, address indexed owner, string certificateNumber);
    event LoanRequested(uint256 indexed loanId, uint256 indexed diamondTokenId, address indexed borrower, bytes32 qrCodeHash);
    event LoanApproved(uint256 indexed loanId, address indexed lender);
    event LoanCancelled(uint256 indexed loanId);
    event OfferPlaced(uint256 indexed offerId, uint256 indexed loanId, address indexed buyer, uint256 amount);
    event OfferAccepted(uint256 indexed offerId, uint256 indexed loanId);
    event DiamondSold(uint256 indexed loanId, uint256 indexed offerId, address buyer, uint256 amount);
    event DiamondReturned(uint256 indexed loanId);
    
    // Modifiers
    modifier onlyDiamondOwner(uint256 tokenId) {
        require(diamonds[tokenId].owner == msg.sender, "Not diamond owner");
        _;
    }
    
    modifier onlyLoanParticipant(uint256 loanId) {
        require(
            loans[loanId].borrower == msg.sender || loans[loanId].lender == msg.sender,
            "Not authorized for this loan"
        );
        _;
    }
    
    modifier validLoan(uint256 loanId) {
        require(loanId > 0 && loanId < nextLoanId, "Invalid loan ID");
        _;
    }
    
    constructor(address _diamondNFTAddress) {
        diamondNFT = DiamondNFT(_diamondNFTAddress);
    }
    
    // Add diamond to inventory
    function addDiamond(
        string memory _certificateNumber,
        uint256 _weight,
        string memory _shape,
        string memory _color,
        string memory _clarity,
        string memory _cut,
        string memory _polish,
        string memory _symmetry,
        string memory _uv,
        uint256 _cost,
        string memory _supplier,
        uint256 _buyingDate,
        uint256 _expenses
    ) external returns (uint256) {
        uint256 tokenId = diamondNFT.mintDiamond(msg.sender, _certificateNumber);
        
        diamonds[tokenId] = Diamond({
            tokenId: tokenId,
            certificateNumber: _certificateNumber,
            weight: _weight,
            shape: _shape,
            color: _color,
            clarity: _clarity,
            cut: _cut,
            polish: _polish,
            symmetry: _symmetry,
            uv: _uv,
            cost: _cost,
            supplier: _supplier,
            buyingDate: _buyingDate,
            expenses: _expenses,
            owner: msg.sender,
            isAvailable: true
        });
        
        emit DiamondAdded(tokenId, msg.sender, _certificateNumber);
        return tokenId;
    }
    
    // Create a loan request (seller initiates)
    function createLoanRequest(
        uint256 _diamondTokenId,
        address _borrower,
        uint256 _loanDuration,
        string memory _terms,
        bytes32 _qrCodeHash
    ) external onlyDiamondOwner(_diamondTokenId) returns (uint256) {
        require(diamonds[_diamondTokenId].isAvailable, "Diamond not available");
        require(_borrower != address(0), "Invalid borrower address");
        require(_loanDuration > 0, "Invalid loan duration");
        
        uint256 loanId = nextLoanId++;
        
        loans[loanId] = LoanAgreement({
            loanId: loanId,
            diamondTokenId: _diamondTokenId,
            borrower: _borrower,
            lender: msg.sender,
            loanDuration: _loanDuration,
            createdAt: block.timestamp,
            approvedAt: 0,
            status: LoanStatus.PENDING,
            terms: _terms,
            qrCodeHash: _qrCodeHash
        });
        
        userLoans[msg.sender].push(loanId);
        userLoans[_borrower].push(loanId);
        
        // Mark diamond as temporarily unavailable
        diamonds[_diamondTokenId].isAvailable = false;
        
        emit LoanRequested(loanId, _diamondTokenId, _borrower, _qrCodeHash);
        return loanId;
    }
    
    // Approve loan request (borrower approves via QR scan)
    function approveLoanRequest(uint256 _loanId, bytes32 _qrCodeHash) 
        external 
        validLoan(_loanId) 
    {
        LoanAgreement storage loan = loans[_loanId];
        require(loan.borrower == msg.sender, "Not the designated borrower");
        require(loan.status == LoanStatus.PENDING, "Loan not pending");
        require(loan.qrCodeHash == _qrCodeHash, "Invalid QR code");
        
        loan.status = LoanStatus.ACTIVE;
        loan.approvedAt = block.timestamp;
        
        emit LoanApproved(_loanId, loan.lender);
    }
    
    // Cancel loan request
    function cancelLoanRequest(uint256 _loanId) 
        external 
        validLoan(_loanId) 
    {
        LoanAgreement storage loan = loans[_loanId];
        require(
            loan.lender == msg.sender || loan.borrower == msg.sender,
            "Not authorized"
        );
        require(loan.status == LoanStatus.PENDING, "Cannot cancel active loan");
        
        loan.status = LoanStatus.CANCELLED;
        diamonds[loan.diamondTokenId].isAvailable = true;
        
        emit LoanCancelled(_loanId);
    }
    
    // Place a bid/offer on borrowed diamond
    function placeOffer(
        uint256 _loanId,
        uint256 _offerAmount,
        uint256 _expirationDays,
        string memory _message
    ) external validLoan(_loanId) returns (uint256) {
        LoanAgreement storage loan = loans[_loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(_offerAmount > 0, "Invalid offer amount");
        require(msg.sender != loan.lender && msg.sender != loan.borrower, "Cannot bid on own loan");
        
        uint256 offerId = nextOfferId++;
        
        offers[offerId] = SaleOffer({
            offerId: offerId,
            loanId: _loanId,
            buyer: msg.sender,
            offerAmount: _offerAmount,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (_expirationDays * 1 days),
            status: OfferStatus.PENDING,
            message: _message
        });
        
        userOffers[msg.sender].push(offerId);
        loanOffers[_loanId].push(offerId);
        
        emit OfferPlaced(offerId, _loanId, msg.sender, _offerAmount);
        return offerId;
    }
    
    // Accept an offer (lender accepts)
    function acceptOffer(uint256 _offerId) external {
        SaleOffer storage offer = offers[_offerId];
        LoanAgreement storage loan = loans[offer.loanId];
        
        require(loan.lender == msg.sender, "Only lender can accept offers");
        require(offer.status == OfferStatus.PENDING, "Offer not pending");
        require(block.timestamp <= offer.expiresAt, "Offer expired");
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        
        offer.status = OfferStatus.ACCEPTED;
        loan.status = LoanStatus.SOLD;
        
        // Transfer diamond ownership to buyer
        diamonds[loan.diamondTokenId].owner = offer.buyer;
        diamonds[loan.diamondTokenId].isAvailable = false; // Sold diamond
        
        // Reject all other pending offers for this loan
        _rejectOtherOffers(offer.loanId, _offerId);
        
        emit OfferAccepted(_offerId, offer.loanId);
        emit DiamondSold(offer.loanId, _offerId, offer.buyer, offer.offerAmount);
    }
    
    // Return diamond (both parties confirm)
    function returnDiamond(uint256 _loanId) 
        external 
        validLoan(_loanId) 
        onlyLoanParticipant(_loanId) 
    {
        LoanAgreement storage loan = loans[_loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        
        loan.status = LoanStatus.RETURNED;
        diamonds[loan.diamondTokenId].isAvailable = true;
        
        // Reject all pending offers for this loan
        _rejectAllOffers(loan.loanId);
        
        emit DiamondReturned(_loanId);
    }
    
    // Internal function to reject other offers
    function _rejectOtherOffers(uint256 _loanId, uint256 _acceptedOfferId) internal {
        uint256[] memory offerIds = loanOffers[_loanId];
        for (uint256 i = 0; i < offerIds.length; i++) {
            if (offerIds[i] != _acceptedOfferId && offers[offerIds[i]].status == OfferStatus.PENDING) {
                offers[offerIds[i]].status = OfferStatus.REJECTED;
            }
        }
    }
    
    // Internal function to reject all offers
    function _rejectAllOffers(uint256 _loanId) internal {
        uint256[] memory offerIds = loanOffers[_loanId];
        for (uint256 i = 0; i < offerIds.length; i++) {
            if (offers[offerIds[i]].status == OfferStatus.PENDING) {
                offers[offerIds[i]].status = OfferStatus.REJECTED;
            }
        }
    }
    
    // View functions
    function getDiamond(uint256 _tokenId) external view returns (Diamond memory) {
        return diamonds[_tokenId];
    }
    
    function getLoan(uint256 _loanId) external view returns (LoanAgreement memory) {
        return loans[_loanId];
    }
    
    function getOffer(uint256 _offerId) external view returns (SaleOffer memory) {
        return offers[_offerId];
    }
    
    function getUserLoans(address _user) external view returns (uint256[] memory) {
        return userLoans[_user];
    }
    
    function getUserOffers(address _user) external view returns (uint256[] memory) {
        return userOffers[_user];
    }
    
    function getLoanOffers(uint256 _loanId) external view returns (uint256[] memory) {
        return loanOffers[_loanId];
    }
    
    function isLoanActive(uint256 _loanId) external view returns (bool) {
        return loans[_loanId].status == LoanStatus.ACTIVE;
    }
    
    function isDiamondAvailable(uint256 _tokenId) external view returns (bool) {
        return diamonds[_tokenId].isAvailable;
    }
}