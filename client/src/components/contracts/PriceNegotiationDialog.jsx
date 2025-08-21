import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Send } from 'lucide-react';

export default function PriceNegotiationDialog({
  open,
  onOpenChange,
  contract,
  currentUser,
  action, // 'buy' or 'sell'
  onSubmit
}) {
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        contractId: contract._id || contract.id,
        price: parseFloat(price),
        action: action,
        proposedBy: currentUser.email
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting price:', error);
      alert('Failed to submit price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDialogTitle = () => {
    if (action === 'buy') {
      return `Buy Diamond #${contract.diamondInfo?.diamondNumber || contract.diamondId}`;
    } else {
      return `Sell Diamond #${contract.diamondInfo?.diamondNumber || contract.diamondId}`;
    }
  };

  const getDialogDescription = () => {
    if (action === 'buy') {
      return `Enter the price you're willing to pay for this diamond. The seller will review your offer.`;
    } else {
      return `Enter the price you want to sell this diamond for. The buyer will review your offer.`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price Per Carat (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !price}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
