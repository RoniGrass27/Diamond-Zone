import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Diamond as DiamondIcon } from "lucide-react";

export default function PlaceBidForm({ diamond, businessName, open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    type: 'MemoFrom',
    duration: 30,
    terms: '',
    buyerEmail: '',
    sellerEmail: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.buyerEmail || !formData.sellerEmail) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Here you would typically create the contract
      // For now, we'll just show a success message
      console.log('Bid form submitted:', {
        diamondId: diamond.id,
        ...formData
      });
      
      alert('Your bid request has been submitted successfully!');
      onSuccess();
      
    } catch (error) {
      console.error('Error submitting bid:', error);
      alert('Failed to submit bid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleOpenChange = (open) => {
    onOpenChange(open);
  };

  if (!diamond) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DiamondIcon className="h-6 w-6 text-sky-500" />
            Place Bid on Diamond #{diamond.diamondNumber || diamond.id?.substring(0, 3)}
          </DialogTitle>
          <DialogDescription>
            Submit a bid request for this diamond from {businessName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Diamond Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-medium text-gray-900 mb-2">Diamond Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Weight:</span>
                <span className="ml-2 font-medium">{diamond.carat || "N/A"} Carats</span>
              </div>
              <div>
                <span className="text-gray-600">Shape:</span>
                <span className="ml-2 font-medium">{diamond.shape || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-600">Color:</span>
                <span className="ml-2 font-medium">{diamond.color || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-600">Price:</span>
                <span className="ml-2 font-medium text-green-600">${diamond.price?.toLocaleString() || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* MemoTo Contract Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">MemoTo Contract Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Contract Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MemoFrom">MemoFrom</SelectItem>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerEmail">Buyer Email *</Label>
              <Input
                id="buyerEmail"
                type="email"
                value={formData.buyerEmail}
                onChange={(e) => handleChange('buyerEmail', e.target.value)}
                placeholder="buyer@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerEmail">Seller Email *</Label>
              <Input
                id="sellerEmail"
                type="email"
                value={formData.sellerEmail}
                onChange={(e) => handleChange('sellerEmail', e.target.value)}
                placeholder="seller@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => handleChange('terms', e.target.value)}
                placeholder="Enter any specific terms or conditions for this contract..."
                rows={3}
              />
            </div>
          </div>



          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {loading ? 'Submitting...' : 'Submit Bid Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}