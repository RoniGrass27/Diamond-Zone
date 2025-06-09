import React from 'react';
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
  AlertCircle
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { 
  formatContractDate, 
  formatContractDateTime,
  isExpiringSoon 
} from "@/utils/dateUtils";

export default function ContractDetailDialog({ 
  contract, 
  open, 
  onOpenChange, 
  currentUser,
  onApprove,
  onReject,
  users = []
}) {
  if (!contract) return null;

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
    if (!currentUser) return { direction: contract.type, counterparty: 'Unknown' };
    
    const userEmail = currentUser.email;
    
    if (contract.type === 'MemoFrom') {
      if (contract.sellerEmail === userEmail) {
        return {
          direction: 'Memo To',
          counterparty: contract.buyerEmail,
          counterpartyName: getUserFullName(contract.buyerEmail),
          isInitiator: true
        };
      } else {
        return {
          direction: 'Memo From',
          counterparty: contract.sellerEmail,
          counterpartyName: getUserFullName(contract.sellerEmail),
          isInitiator: false
        };
      }
    } else if (contract.type === 'Buy') {
      if (contract.buyerEmail === userEmail) {
        return {
          direction: 'Buying From',
          counterparty: contract.sellerEmail,
          counterpartyName: getUserFullName(contract.sellerEmail),
          isInitiator: true
        };
      } else {
        return {
          direction: 'Sell To',
          counterparty: contract.buyerEmail,
          counterpartyName: getUserFullName(contract.buyerEmail),
          isInitiator: false
        };
      }
    } else if (contract.type === 'Sell') {
      if (contract.sellerEmail === userEmail) {
        return {
          direction: 'Selling To',
          counterparty: contract.buyerEmail,
          counterpartyName: getUserFullName(contract.buyerEmail),
          isInitiator: true
        };
      } else {
        return {
          direction: 'Buy From',
          counterparty: contract.sellerEmail,
          counterpartyName: getUserFullName(contract.sellerEmail),
          isInitiator: false
        };
      }
    }
    
    return { 
      direction: contract.type, 
      counterparty: 'Unknown',
      counterpartyName: 'Unknown'
    };
  };

  const getDiamondDisplayNumber = () => {
    if (contract.diamondInfo && contract.diamondInfo.diamondNumber) {
      return `#${String(contract.diamondInfo.diamondNumber).padStart(3, '0')}`;
    }
    
    if (contract.diamondId && contract.diamondId.diamondNumber) {
      return `#${String(contract.diamondId.diamondNumber).padStart(3, '0')}`;
    }
    
    return 'N/A';
  };

  const getDiamondInfo = () => {
    return contract.diamondInfo || contract.diamondId || {};
  };

  const canApprove = () => {
    if (!currentUser || contract.status !== 'pending') return false;
    
    const userEmail = currentUser.email;
    
    if (contract.type === 'MemoFrom') {
      return contract.buyerEmail === userEmail;
    } else if (contract.type === 'Buy') {
      return contract.sellerEmail === userEmail;
    } else if (contract.type === 'Sell') {
      return contract.buyerEmail === userEmail;
    }
    
    return false;
  };

  const displayInfo = getContractDisplayInfo();
  const diamondInfo = getDiamondInfo();

  const getStatusColor = () => {
    switch (contract.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'returned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (contract.status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      case 'returned':
        return <DiamondIcon className="h-4 w-4" />;
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
            Contract #{String(contract.contractNumber || '000').padStart(3, '0')}
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              {contract.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {/* Updated to show creation time */}
            {displayInfo.direction} • Created {formatDateTimeDisplay(contract.createdDate)}
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
                  <span className="ml-2 font-medium">{getUserFullName(contract.buyerEmail)}</span>
                  <div className="text-xs text-gray-400">{contract.buyerEmail}</div>
                </div>
                <div>
                  <span className="text-gray-500">Seller:</span>
                  <span className="ml-2 font-medium">{getUserFullName(contract.sellerEmail)}</span>
                  <div className="text-xs text-gray-400">{contract.sellerEmail}</div>
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

          {/* Contract Details - Updated to show times */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contract Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium">{contract.type}</span>
              </div>
              
              {contract.price && (
                <div>
                  <span className="text-gray-500">Price:</span>
                  <span className="ml-2 font-medium text-green-600">${contract.price.toLocaleString()}</span>
                </div>
              )}

              {contract.duration && (
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">{contract.duration} days</span>
                </div>
              )}

              <div>
                <span className="text-gray-500">Created:</span>
                <div className="ml-2">
                  <div className="font-medium">{formatContractDate(contract.createdDate)}</div>
                  <div className="text-xs text-gray-400">
                    at {formatTimeOnly(contract.createdDate)}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-gray-500">Expires:</span>
                <div className={`ml-2 ${checkExpiringSoon(contract.expirationDate) ? 'text-red-600 font-semibold' : ''}`}>
                  <div className="font-medium">{formatContractDate(contract.expirationDate)}</div>
                  {checkExpiringSoon(contract.expirationDate) && (
                    <div className="text-xs text-red-600 font-semibold">⚠️ Expiring Soon</div>
                  )}
                </div>
              </div>

              {contract.approvedAt && (
                <div>
                  <span className="text-gray-500">Approved:</span>
                  <div className="ml-2">
                    <div className="font-medium">{formatContractDate(contract.approvedAt)}</div>
                    <div className="text-xs text-gray-400">
                      at {formatTimeOnly(contract.approvedAt)}
                    </div>
                  </div>
                </div>
              )}

              {contract.rejectedAt && (
                <div>
                  <span className="text-gray-500">Rejected:</span>
                  <div className="ml-2">
                    <div className="font-medium">{formatContractDate(contract.rejectedAt)}</div>
                    <div className="text-xs text-gray-400">
                      at {formatTimeOnly(contract.rejectedAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          {contract.terms && contract.terms.trim() !== '' && contract.terms !== 'Standard terms apply.' && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Terms & Conditions</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                {contract.terms}
              </p>
            </div>
          )}

          {/* Blockchain Info */}
          {contract.blockchain_enabled && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Blockchain Information</h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-500">Enabled:</span>
                  <span className="ml-2 text-green-600">✓ Yes</span>
                </div>
                {contract.wallet_address && (
                  <div>
                    <span className="text-gray-500">Wallet:</span>
                    <span className="ml-2 font-mono text-xs">{contract.wallet_address}</span>
                  </div>
                )}
                {contract.blockchain_transaction_hash && (
                  <div>
                    <span className="text-gray-500">Transaction:</span>
                    <span className="ml-2 font-mono text-xs">{contract.blockchain_transaction_hash}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canApprove() && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => onApprove && onApprove(contract._id || contract.id)}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Contract
              </Button>
              <Button
                variant="outline"
                onClick={() => onReject && onReject(contract._id || contract.id)}
                className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject Contract
              </Button>
            </div>
          )}

          {!canApprove() && contract.status === 'pending' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ Waiting for {displayInfo.counterpartyName} to {displayInfo.isInitiator ? 'respond to' : 'approve'} this contract.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}