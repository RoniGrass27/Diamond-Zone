import React, { useState, useEffect } from 'react';
import { Diamond } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Diamond as DiamondIcon, 
  User as UserIcon, 
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  X,
  AlertCircle,
  Send
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { 
  formatContractDate, 
  formatContractDateTime,
  isExpiringSoon 
} from "@/utils/dateUtils";
import PriceNegotiationDialog from './PriceNegotiationDialog';

export default function ContractDetailDialog({ 
  contract, 
  open, 
  onOpenChange, 
  currentUser,
  onApprove,
  onReject,
  users = [],
  onContractUpdate
}) {
  if (!contract) return null;

  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [priceAction, setPriceAction] = useState(null); // 'buy' or 'sell'
  const [localContract, setLocalContract] = useState(contract);

  // Update local contract when prop changes
  useEffect(() => {
    setLocalContract(contract);
  }, [contract]);

  const handleReturnDiamond = async (contract) => {
    try {
      // Check if return is already pending
      if (contract.returnRequested) {
        return;
      }

      // Check if current user can request return
      const userEmail = currentUser.email;
      const isBuyer = contract.buyerEmail === userEmail;
      const isSeller = contract.sellerEmail === userEmail;
      
      if (!isBuyer && !isSeller) {
        return;
      }

      // Send return request to backend
      const response = await fetch(`/api/contracts/${contract._id}/request-return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Update the contract locally to show the return request status
        const updatedContract = await response.json();
        setLocalContract(updatedContract.contract);
        // Refresh the contract data in the parent component
        if (onContractUpdate) {
          onContractUpdate();
        }
        // Close the contract window
        onOpenChange(false);
      } else {
        console.error('Failed to request return');
      }
    } catch (error) {
      console.error('Error requesting return:', error);
    }
  };

  const handleApproveReturn = async (contract) => {
    try {
      const response = await fetch(`/api/contracts/${contract._id}/approve-return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setLocalContract(result.contract);
        // Refresh the contract data in the parent component
        if (onContractUpdate) {
          onContractUpdate();
        }
        // Close the contract window
        onOpenChange(false);
      } else {
        console.error('Failed to approve return');
      }
    } catch (error) {
      console.error('Error approving return:', error);
    }
  };

  const handleSellDiamond = () => {
    setPriceAction('sell');
    setShowPriceDialog(true);
  };

  const handleBuyDiamond = () => {
    setPriceAction('buy');
    setShowPriceDialog(true);
  };

  const handlePriceSubmit = async (priceData) => {
    try {
      const response = await fetch('/api/contracts/price-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(priceData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the local contract data with the new price offer
        setLocalContract(result.contract);
        
        // Call the parent's update function to refresh the contract list
        if (onContractUpdate) {
          onContractUpdate();
        }
        
        // Close the price dialog
        setShowPriceDialog(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit price offer');
      }
    } catch (error) {
      console.error('Error submitting price offer:', error);
      throw error;
    }
  };

  const handleApproveSale = async (contract) => {
    try {
      const response = await fetch(`/api/contracts/${contract._id}/approve-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Update local contract state
        setLocalContract(prev => ({
          ...prev,
          status: 'completed',
          saleCompleted: true,
          priceOffer: {
            ...prev.priceOffer,
            status: 'approved'
          }
        }));

        // Force refresh of both contract list and inventory
        if (onContractUpdate) {
          onContractUpdate();
        }

        // Refresh inventory data
        try {
          await fetch('/api/diamonds/refresh', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        } catch (refreshError) {
          console.log('Inventory refresh failed, will use page reload instead');
        }

        // Force page refresh to ensure all updates are visible
        window.location.reload();

        // Close the contract window
        onOpenChange(false);
      } else {
        console.error('Failed to approve sale');
      }
    } catch (error) {
      console.error('Error approving sale:', error);
    }
  };

  const handleRejectSale = async (contract) => {
    try {
      const response = await fetch(`/api/contracts/${contract._id}/reject-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setLocalContract(result.contract);
        // Refresh the contract data in the parent component
        if (onContractUpdate) {
          onContractUpdate();
        }
      } else {
        console.error('Failed to reject sale');
      }
    } catch (error) {
      console.error('Error rejecting sale:', error);
    }
  };

  // Helper function to safely format dates with time
  const formatDateTimeDisplay = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      let date;
      
      // Handle different date formats
      if (typeof dateValue === 'string') {
        // Clean the string to remove any unwanted characters
        let cleanDateString = dateValue.trim();
        
        // Remove any non-date characters but keep ISO format chars
        cleanDateString = cleanDateString.replace(/[^0-9a-zA-Z\s,:-T.Z]/g, '');
        
        // Try parsing as ISO string first
        if (cleanDateString.includes('T') || cleanDateString.includes('-')) {
          date = new Date(cleanDateString);
        } else {
          date = new Date(cleanDateString);
        }
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return 'N/A';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateValue);
        return 'Invalid Date';
      }
      
      return format(date, "MMM d, yyyy 'at' HH:mm");
    } catch (error) {
      console.error('Date formatting error:', error, 'for value:', dateValue);
      return 'Invalid Date';
    }
  };

  // Helper function to get just the time from a date
  const formatTimeOnly = (dateValue) => {
    if (!dateValue) return '';
    
    try {
      let date;
      
      if (typeof dateValue === 'string') {
        let cleanDateString = dateValue.trim();
        cleanDateString = cleanDateString.replace(/[^0-9a-zA-Z\s,:-T.Z]/g, '');
        date = new Date(cleanDateString);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Time formatting error:', error);
      return '';
    }
  };

  const getUserFullName = (email) => {
    const user = users.find(u => u.email === email);
    return user ? user.fullName || user.full_name : email;
  };

  const getContractDisplayInfo = () => {
    if (!currentUser) return { direction: localContract.type, counterparty: 'Unknown' };
    
    const userEmail = currentUser.email;
    
    // Handle completed sales with new contract types
    if (localContract.status === 'completed' && localContract.saleCompleted) {
      if (localContract.type === 'Buy') {
        if (localContract.buyerEmail === userEmail) {
          return {
            direction: 'Buy',
            counterparty: localContract.sellerEmail,
            counterpartyName: getUserFullName(localContract.sellerEmail),
            isInitiator: true
          };
        } else {
          return {
            direction: 'Sell',
            counterparty: localContract.buyerEmail,
            counterpartyName: getUserFullName(localContract.buyerEmail),
            isInitiator: false
          };
        }
      } else if (localContract.type === 'Sell') {
        if (localContract.sellerEmail === userEmail) {
          return {
            direction: 'Sell',
            counterparty: localContract.buyerEmail,
            counterpartyName: getUserFullName(localContract.buyerEmail),
            isInitiator: true
          };
        } else {
          return {
            direction: 'Buy',
            counterparty: localContract.sellerEmail,
            counterpartyName: getUserFullName(localContract.sellerEmail),
            isInitiator: false
          };
        }
      }
    }
    
    // Handle existing memo contracts
    if (localContract.type === 'MemoFrom') {
      if (localContract.sellerEmail === userEmail) {
        return {
          direction: 'Memo From', // Seller sees "Memo From"
          counterparty: localContract.buyerEmail,
          counterpartyName: getUserFullName(localContract.buyerEmail),
          isInitiator: true
        };
      } else {
        return {
          direction: 'Memo To', // Buyer sees "Memo To"
          counterparty: localContract.sellerEmail,
          counterpartyName: getUserFullName(localContract.sellerEmail),
          isInitiator: false
        };
      }
    } else if (localContract.type === 'MemoTo') {
      if (localContract.sellerEmail === userEmail) {
        return {
          direction: 'Memo From', // Seller sees "Memo From"
          counterparty: localContract.buyerEmail,
          counterpartyName: getUserFullName(localContract.buyerEmail),
          isInitiator: false  // Seller is NOT the initiator for MemoTo
        };
      } else {
        return {
          direction: 'Memo To', // Buyer sees "Memo To"
          counterparty: localContract.sellerEmail,
          counterpartyName: getUserFullName(localContract.sellerEmail),
          isInitiator: true  // Buyer IS the initiator for MemoTo
        };
      }
    } else if (localContract.type === 'Buy') {
      if (localContract.buyerEmail === userEmail) {
        return {
          direction: 'Buying From',
          counterparty: localContract.sellerEmail,
          counterpartyName: getUserFullName(localContract.sellerEmail),
          isInitiator: true
        };
      } else {
        return {
          direction: 'Sell To',
          counterparty: localContract.buyerEmail,
          counterpartyName: getUserFullName(localContract.buyerEmail),
          isInitiator: false
        };
      }
    } else if (localContract.type === 'Sell') {
      if (localContract.sellerEmail === userEmail) {
        return {
          direction: 'Selling To',
          counterparty: localContract.buyerEmail,
          counterpartyName: getUserFullName(localContract.buyerEmail),
          isInitiator: true
        };
      } else {
        return {
          direction: 'Buy From',
          counterparty: localContract.sellerEmail,
          counterpartyName: getUserFullName(localContract.sellerEmail),
          isInitiator: false
        };
      }
    }
    
    return { 
      direction: localContract.type, 
      counterparty: 'Unknown',
      counterpartyName: 'Unknown'
    };
  };

  const getDiamondDisplayNumber = () => {
    if (localContract.diamondInfo && localContract.diamondInfo.diamondNumber) {
      return `#${String(localContract.diamondInfo.diamondNumber).padStart(3, '0')}`;
    }
    
    if (localContract.diamondId && localContract.diamondId.diamondNumber) {
      return `#${String(localContract.diamondId.diamondNumber).padStart(3, '0')}`;
    }
    
    return 'N/A';
  };

  const getDiamondInfo = () => {
    // For completed sales, show the updated diamond info
    if (localContract.status === 'completed' && localContract.saleCompleted) {
      return {
        ...localContract.diamondInfo,
        price: localContract.salePrice || localContract.priceOffer?.price,
        status: localContract.type === 'Buy' ? 'In Stock' : 'Sold'
      };
    }
    
    return localContract.diamondInfo || localContract.diamondId || {};
  };

  // Helper functions to determine user role
  const isCurrentUserBuyer = () => {
    if (!currentUser) return false;
    return localContract.buyerEmail === currentUser.email;
  };

  const isCurrentUserSeller = () => {
    if (!currentUser) return false;
    return localContract.sellerEmail === currentUser.email;
  };

  // Helper function to check if return can be approved by current user
  const canApproveReturn = () => {
    if (!currentUser || !localContract.returnRequested || localContract.returnStatus !== 'pending_approval') {
      return false;
    }
    
    const userEmail = currentUser.email;
    const returnRequester = localContract.returnRequestedBy;
    
    // User cannot approve their own return request
    if (returnRequester === userEmail) {
      return false;
    }
    
    // Only buyer or seller can approve return
    return localContract.buyerEmail === userEmail || localContract.sellerEmail === userEmail;
  };

  // Helper function to check if return can be requested
  const canRequestReturn = () => {
    if (!currentUser || localContract.status !== 'approved') {
      return false;
    }
    
    // Check if return is already requested
    if (localContract.returnRequested) {
      return false;
    }
    
    const userEmail = currentUser.email;
    return localContract.buyerEmail === userEmail || localContract.sellerEmail === userEmail;
  };

  const canApprove = () => {
    if (!currentUser || localContract.status !== 'pending') return false;
    
    const userEmail = currentUser.email;
    
    if (localContract.type === 'MemoFrom') {
      return localContract.buyerEmail === userEmail; // Buyer approves MemoFrom
    } else if (localContract.type === 'MemoTo') {
      return localContract.sellerEmail === userEmail; // Seller approves MemoTo
    } else if (localContract.type === 'Buy') {
      return localContract.sellerEmail === userEmail;
    } else if (localContract.type === 'Sell') {
      return localContract.buyerEmail === userEmail;
    }
    
    return false;
  };

  const displayInfo = getContractDisplayInfo();
  const diamondInfo = getDiamondInfo();

  const getStatusColor = () => {
    switch (localContract.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'returned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (localContract.status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      case 'returned':
        return <DiamondIcon className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Check if expiration is soon
  const checkExpiringSoon = (expirationDate) => {
    return isExpiringSoon(expirationDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract #{String(localContract.contractNumber || '000').padStart(3, '0')}
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              {localContract.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {displayInfo.direction} • Created {formatContractDateTime(localContract.createdDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Parties Involved
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Buyer:</span>
                  <span className="ml-2 font-medium">{getUserFullName(localContract.buyerEmail)}</span>
                  <div className="text-xs text-gray-400">{localContract.buyerEmail}</div>
                </div>
                <div>
                  <span className="text-gray-500">Seller:</span>
                  <span className="ml-2 font-medium">{getUserFullName(localContract.sellerEmail)}</span>
                  <div className="text-xs text-gray-400">{localContract.sellerEmail}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DiamondIcon className="h-4 w-4" />
                Diamond Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Diamond #:</span>
                  <span className="ml-2 font-medium">{getDiamondDisplayNumber()}</span>
                </div>
                {diamondInfo.carat && (
                  <div>
                    <span className="text-gray-500">Weight:</span>
                    <span className="ml-2 font-medium">{diamondInfo.carat} ct</span>
                  </div>
                )}
                {diamondInfo.price && (
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <span className="ml-2 font-medium text-green-600">${diamondInfo.price.toLocaleString()}</span>
                  </div>
                )}
                {diamondInfo.status && (
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium">{diamondInfo.status}</span>
                  </div>
                )}
                {diamondInfo.color && diamondInfo.clarity && (
                  <div>
                    <span className="text-gray-500">Grade:</span>
                    <span className="ml-2 font-medium">{diamondInfo.color} • {diamondInfo.clarity}</span>
                  </div>
                )}
                {diamondInfo.cut && (
                  <div>
                    <span className="text-gray-500">Cut:</span>
                    <span className="ml-2 font-medium">{diamondInfo.cut}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contract Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium">{localContract.type}</span>
              </div>
              
              {localContract.price && (
                <div>
                  <span className="text-gray-500">Price:</span>
                  <span className="ml-2 font-medium text-green-600">${localContract.price.toLocaleString()}</span>
                </div>
              )}

              {localContract.duration && (
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">{localContract.duration} days</span>
                </div>
              )}

              <div>
                <span className="text-gray-500">Created:</span>
                <div className="ml-2">
                  <div className="font-medium">{formatContractDate(localContract.createdDate)}</div>
                  <div className="text-xs text-gray-400">
                    at {formatContractDateTime(localContract.createdDate).split('at ')[1]}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-gray-500">Expires:</span>
                <div className={`ml-2 ${checkExpiringSoon(localContract.expirationDate) ? 'text-red-600 font-semibold' : ''}`}>
                  <div className="font-medium">{formatContractDate(localContract.expirationDate)}</div>
                  {checkExpiringSoon(localContract.expirationDate) && (
                    <div className="text-xs text-red-600 font-semibold">⚠️ Expiring Soon</div>
                  )}
                </div>
              </div>

              {localContract.approvedAt && (
                <div>
                  <span className="text-gray-500">Approved:</span>
                  <div className="ml-2">
                    <div className="font-medium">{formatContractDate(localContract.approvedAt)}</div>
                    <div className="text-xs text-gray-400">
                      at {formatContractDateTime(localContract.approvedAt).split('at ')[1]}
                    </div>
                  </div>
                </div>
              )}

              {localContract.rejectedAt && (
                <div>
                  <span className="text-gray-500">Rejected:</span>
                  <div className="ml-2">
                    <div className="font-medium">{formatContractDate(localContract.rejectedAt)}</div>
                    <div className="text-xs text-gray-400">
                      at {formatContractDateTime(localContract.rejectedAt).split('at ')[1]}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          {localContract.terms && localContract.terms.trim() !== '' && localContract.terms !== 'Standard terms apply.' && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Terms & Conditions</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                {localContract.terms}
              </p>
            </div>
          )}

          {/* Blockchain Info */}
          {localContract.blockchain_enabled && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Blockchain Information</h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-500">Enabled:</span>
                  <span className="ml-2 text-green-600">✓ Yes</span>
                </div>
                {localContract.wallet_address && (
                  <div>
                    <span className="text-gray-500">Wallet:</span>
                    <span className="ml-2 font-mono text-xs">{localContract.wallet_address}</span>
                  </div>
                )}
                {localContract.blockchain_transaction_hash && (
                  <div>
                    <span className="text-gray-500">Transaction:</span>
                    <span className="ml-2 font-mono text-xs">{localContract.blockchain_transaction_hash}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canApprove() && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => onApprove && onApprove(localContract._id || localContract.id)}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Contract
              </Button>
              <Button
                variant="outline"
                onClick={() => onReject && onReject(localContract._id || localContract.id)}
                className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject Contract
              </Button>
            </div>
          )}

                          {/* Return Diamond Button for MemoFrom and MemoTo Contracts */}
          {(localContract.type === 'MemoFrom' || localContract.type === 'MemoTo') && localContract.status === 'approved' && !localContract.priceOffer && (
            <div className="flex gap-3 pt-4 border-t">
              {/* Return Diamond Button - shown to both buyer and seller */}
              {canRequestReturn() && (
              <Button
                  onClick={() => handleReturnDiamond(localContract)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                <DiamondIcon className="h-4 w-4 mr-2" />
                  Request Return
                </Button>
              )}

              {/* Approve Return Button - shown to the other party */}
              {canApproveReturn() && (
                <Button
                  onClick={() => handleApproveReturn(localContract)}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Return
                </Button>
              )}

              {/* Return Status Display */}
              {localContract.returnRequested && localContract.returnStatus === 'pending_approval' && (
                <div className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 text-center">
                    ⏳ Return request pending approval from {getUserFullName(localContract.returnRequestedBy === localContract.buyerEmail ? localContract.sellerEmail : localContract.buyerEmail)}
                  </p>
                </div>
              )}

              {/* Sell Diamond Button for Seller */}
              {isCurrentUserSeller() && !localContract.returnRequested && (
                <Button
                  onClick={() => handleSellDiamond(localContract)}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Sell Diamond
                </Button>
              )}
              
              {/* Buy Diamond Button for Buyer */}
              {isCurrentUserBuyer() && !localContract.returnRequested && (
                <Button
                  onClick={() => handleBuyDiamond(localContract)}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Buy Diamond
                </Button>
              )}
            </div>
          )}

          {/* Price Offer Display */}
          {localContract.priceOffer && localContract.priceOffer.status === 'pending' && (
            <div className="pt-4 border-t">
              {localContract.priceOffer.proposedBy === currentUser.email ? (
                // Show "offer sent" message for the proposer
                <div className="text-center py-4">
                  <div className="text-lg font-semibold text-blue-600 mb-2">
                    Price offer was sent...
                  </div>
                  <div className="text-sm text-gray-600">
                    You offered to {localContract.priceOffer.action} for ${localContract.priceOffer.price}
                  </div>
                </div>
              ) : (
                // Show offer details and approve/reject buttons for the other party
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <div className="text-lg font-semibold text-blue-800 mb-2">
                      Price Offer Received
                    </div>
                    <div className="text-sm text-gray-700">
                      {localContract.priceOffer.proposedBy === localContract.buyerEmail ? 'Buyer' : 'Seller'} wants to {localContract.priceOffer.action} for ${localContract.priceOffer.price}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApproveSale(localContract)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectSale(localContract)}
                      variant="outline"
                      className="flex-1"
                    >
                      Reject
              </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completed Sale Status */}
          {localContract.status === 'completed' && localContract.saleCompleted && (
            <div className="pt-4 border-t">
              <div className="text-center py-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-700 mb-3">
                  Diamond sold!
                </div>
                <div className="text-lg text-green-600 mb-2">
                  Sale Price: ${localContract.salePrice || localContract.priceOffer?.price}
                </div>
                <div className="text-base text-green-600 mb-2">
                  Sold to: {getUserFullName(localContract.buyerEmail)}
                </div>
                <div className="text-sm text-gray-600">
                  Contract completed on {new Date(localContract.saleCompletedAt || localContract.priceOffer?.approvedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {!canApprove() && localContract.status === 'pending' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ Waiting for {displayInfo.counterpartyName} to {displayInfo.isInitiator ? 'respond to' : 'approve'} this contract.
              </p>
            </div>
          )}

          {/* Price Negotiation Dialog */}
          <PriceNegotiationDialog
            open={showPriceDialog}
            onOpenChange={setShowPriceDialog}
            contract={localContract}
            currentUser={currentUser}
            action={priceAction}
            onSubmit={handlePriceSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}