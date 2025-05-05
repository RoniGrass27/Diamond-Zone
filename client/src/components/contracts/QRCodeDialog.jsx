import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function QRCodeDialog({ contract, open, onOpenChange, diamonds }) {
  if (!contract) return null;

  const diamond = diamonds.find(d => d.id === contract.diamond_id);
  
  // Generate QR code URL with contract data
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    JSON.stringify({
      contract_number: contract.contract_number,
      type: contract.type,
      diamond: diamond?.name || 'Unknown Diamond',
      status: contract.status,
      created_date: contract.created_date,
      expiration_date: contract.expiration_date
    })
  )}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `contract-${contract.contract_number}.png`;
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
            <h3 className="font-semibold text-lg">Contract #{contract.contract_number}</h3>
            <p className="text-gray-500">{contract.type} • {contract.status}</p>
          </div>

          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Diamond:</span>
              <span className="font-medium">{diamond?.name || 'Unknown Diamond'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Created:</span>
              <span className="font-medium">{format(new Date(contract.created_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Expires:</span>
              <span className="font-medium">{format(new Date(contract.expiration_date), 'MMM d, yyyy')}</span>
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