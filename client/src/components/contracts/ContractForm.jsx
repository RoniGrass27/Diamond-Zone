import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ContractForm({ onSubmit, onCancel, diamonds }) {
  const [emailError, setEmailError] = useState('');
  const [formData, setFormData] = useState({
    type: 'MemoTo',
    diamond_id: '',
    buyer_email: '',
    seller_email: '',
    price: null, // Changed from empty string to null
    expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const handleChange = (field, value) => {
    // Special handling for price field
    if (field === 'price') {
      // Convert to number or null if empty
      const numValue = value === '' ? null : Number(value);
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (field === 'buyer_email' || field === 'seller_email') {
      setEmailError('');
    }
  };

  function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if ((formData.buyer_email && !isValidEmail(formData.buyer_email)) ||
          (formData.seller_email && !isValidEmail(formData.seller_email))) {
      setEmailError('Invalid email address');
      return;
    }

    setEmailError('');
    
    // Create a clean version of the data for submission
    const submitData = {
      ...formData,
      // Only include price if it's a Buy/Sell contract
      price: (formData.type === 'Buy' || formData.type === 'Sell') 
        ? formData.price 
        : null,
      // Only include relevant email based on contract type
      buyer_email: formData.type === 'Buy' || formData.type === 'MemoFrom' 
        ? formData.buyer_email 
        : null,
      seller_email: formData.type === 'Sell' || formData.type === 'MemoTo'
        ? formData.seller_email 
        : null
    };

    console.log("Submitting contract with data:", submitData);
    onSubmit(submitData);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
          <DialogDescription>
            Set up a new contract for borrowing, lending, buying, or selling diamonds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Contract Type</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MemoTo" id="memoTo" />
                  <Label htmlFor="memoTo">Memo to</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MemoFrom" id="memoFrom" />
                  <Label htmlFor="memoFrom">Memo from</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Buy" id="buy" />
                  <Label htmlFor="buy">Buy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sell" id="sell" />
                  <Label htmlFor="sell">Sell</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="diamond">Select Diamond</Label>
              <Select
                value={formData.diamond_id}
                onValueChange={(value) => handleChange('diamond_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a diamond" />
                </SelectTrigger>
                <SelectContent>
                  {diamonds.map(diamond => (
                    <SelectItem key={diamond.id} value={diamond.id}>
                      {`#${String(diamond.diamondNumber).padStart(3, '0')}` || `Diamond #${diamond.id.slice(0, 4)}`} - {diamond.carat}ct
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="counterparty">
                {formData.type === 'Buy' || formData.type === 'MemoTo' 
                  ? "From (Email)" 
                  : "To (Email)"}
              </Label>
              <Input
                id="counterparty"
                type="email"
                required
                value={
                  formData.type === 'Buy' || formData.type === 'MemoFrom'
                    ? formData.seller_email
                    : formData.buyer_email
                }
                onChange={(e) => {
                  const field = (formData.type === 'Buy' || formData.type === 'MemoFrom')
                    ? 'seller_email'
                    : 'buyer_email';
                  handleChange(field, e.target.value);
                }}
                placeholder="Enter email address"
                className={emailError ? 'border-red-500' : ''}
              />
              {emailError && (
                <p className="text-sm text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            {(formData.type === 'Buy' || formData.type === 'Sell') && (
              <div>
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="Enter price"
                />
              </div>
            )}

            <div>
              <Label htmlFor="expiration">Expiration Date</Label>
              <Input
                id="expiration"
                type="date"
                required
                value={formData.expiration_date}
                onChange={(e) => handleChange('expiration_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-sky-500 hover:bg-sky-600"
              disabled={!formData.diamond_id || (!formData.buyer_email && !formData.seller_email)}
            >
              Create Contract
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}