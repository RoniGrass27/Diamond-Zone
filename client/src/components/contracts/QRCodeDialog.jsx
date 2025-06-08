import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, isValid, parseISO } from "date-fns";

export default function QRCodeDialog({ contract, open, onOpenChange, diamonds }) {
  if (!contract) return null;

  const diamond = diamonds.find(d => d.id === contract.diamond_id);
  
  // Helper function to safely format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    let date;
    if (typeof dateValue === 'string') {
      date = parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'N/A';
    }
    
    if (!isValid(date)) {
      return 'Invalid Date';
    }
    
    try {
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // Get diamond display name
  const getDiamondName = () => {
    if (contract.diamondInfo && contract.diamondInfo.diamondNumber) {
      return `#${String(contract.diamondInfo.diamondNumber).padStart(3, '0')}`;
    }
    
    if (contract.diamondId && contract.diamondId.diamondNumber) {
      return `#${String(contract.diamondId.diamondNumber).padStart(3, '0')}`;
    }
    
    if (diamond && diamond.diamondNumber) {
      return `#${String(diamond.diamondNumber).padStart(3, '0')}`;
    }
    
    return diamond?.name || 'Unknown Diamond';
  };
  
  // Generate QR code URL with contract data
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    JSON.stringify({
      contract_number: contract.contractNumber || contract.contract_number,
      type: contract.type,
      diamond: getDiamondName(),
      status: contract.status,
      created_date: contract.createdDate || contract.created_date,
      expiration_date: contract.expirationDate || contract.expiration_date
    })
  )}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `contract-${contract.contractNumber || contract.contract_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Contract QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <img src={qrCodeUrl} alt="Contract QR Code" className="w-48 h-48" />
          </div>

          <div className="text-center">
            <h3 className="font-semibold text-lg">
              Contract #{String(contract.contractNumber || contract.contract_number || '000').padStart(3, '0')}
            </h3>
            <p className="text-gray-500">{contract.type} • {contract.status}</p>
          </div>

          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Diamond:</span>
              <span className="font-medium">{getDiamondName()}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Created:</span>
              <span className="font-medium">
                {formatDate(contract.createdDate || contract.created_date)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Expires:</span>
              <span className="font-medium">
                {formatDate(contract.expirationDate || contract.expiration_date)}
              </span>
            </div>
          </div>

          <Button onClick={handleDownload} className="w-full">
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}