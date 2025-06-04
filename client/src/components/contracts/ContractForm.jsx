import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, Link, AlertCircle, CheckCircle } from "lucide-react";

// Import BlockchainService (you'll need to create this)
// For now, we'll create a simple mock
const BlockchainService = {
  getWallet: async (userId) => {
    // Mock implementation - replace with real service later
    return null;
  },
  createWallet: async (userId) => {
    // Mock implementation - replace with real service later
    return { success: true, wallet: { address: '0x1234...', createdAt: new Date() } };
  },
  formatAddress: (address) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  }
};

export default function ContractForm({ onSubmit, onCancel, diamonds }) {
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBlockchain, setUseBlockchain] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'MemoTo',
    diamond_id: '',
    buyer_email: '',
    seller_email: '',
    price: null,
    expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    // New blockchain-specific fields
    duration: 30, // days
    terms: '',
    blockchain_enabled: false
  });

  // Load current user and wallet info on component mount
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/api/me');
      const userData = await response.json();
      setCurrentUser(userData);
      
      if (userData.walletCreated) {
        setWalletInfo({
          address: userData.walletAddress,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const createWallet = async () => {
    try {
      setWalletLoading(true);
      const response = await fetch('/api/users/enable-blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setWalletInfo(result.wallet);
        // Reload user data
        await loadCurrentUser();
      } else {
        alert('Failed to create wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      alert('Failed to create wallet. Please try again.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleChange = (field, value) => {
    if (field === 'price') {
      const numValue = value === '' ? null : Number(value);
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else if (field === 'duration') {
      setFormData(prev => ({ ...prev, [field]: parseInt(value) || 30 }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (field === 'buyer_email' || field === 'seller_email') {
      setEmailError('');
    }
  };

  const handleBlockchainToggle = (enabled) => {
    setUseBlockchain(enabled);
    setFormData(prev => ({ ...prev, blockchain_enabled: enabled }));
  };

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate emails
      if ((formData.buyer_email && !isValidEmail(formData.buyer_email)) ||
          (formData.seller_email && !isValidEmail(formData.seller_email))) {
        setEmailError('Invalid email address');
        return;
      }

      setEmailError('');

      // Check if blockchain is enabled but wallet doesn't exist
      if (useBlockchain && !walletInfo) {
        alert('Please create a wallet first to use blockchain features');
        return;
      }

      // Prepare contract data (same as your original logic)
      const contractData = {
        ...formData,
        price: (formData.type === 'Buy' || formData.type === 'Sell') ? formData.price : null,
        buyer_email: formData.type === 'Buy' || formData.type === 'MemoFrom' ? formData.buyer_email : null,
        seller_email: formData.type === 'Sell' || formData.type === 'MemoTo' ? formData.seller_email : null,
        blockchain_enabled: useBlockchain,
        wallet_address: walletInfo?.address
      };

      console.log("Submitting contract with data:", contractData);

      // Submit to your existing API
      await onSubmit(contractData);

      // Future: Add blockchain operations here when ready

    } catch (error) {
      console.error('Error submitting contract:', error);
      alert('Failed to create contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDiamond = () => {
    return diamonds.find(d => d.id === formData.diamond_id);
  };

  const isLendingContract = formData.type === 'MemoTo';

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
          <DialogDescription>
            Set up a new contract for borrowing, lending, buying, or selling diamonds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contract Type - Same as your original */}
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

            {/* Diamond Selection - Same as your original */}
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

            {/* Counterparty Email - Same as your original */}
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

            {/* Price for Buy/Sell - Same as your original */}
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

            {/* NEW: Loan Duration for Lending */}
            {isLendingContract && (
              <div>
                <Label htmlFor="duration">Loan Duration (Days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="Enter duration in days"
                />
              </div>
            )}

            {/* NEW: Terms for Lending */}
            {isLendingContract && (
              <div>
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => handleChange('terms', e.target.value)}
                  placeholder="Enter any specific terms or conditions..."
                  rows={3}
                />
              </div>
            )}

            {/* Expiration Date - Same as your original */}
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

          {/* NEW: Blockchain Integration Section */}
          {isLendingContract && (
            <Card className="border-sky-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Blockchain Integration
                  </CardTitle>
                  <Switch
                    checked={useBlockchain}
                    onCheckedChange={handleBlockchainToggle}
                    disabled={!walletInfo}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Wallet Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm font-medium">Wallet Status:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {walletLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : walletInfo ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Connected</span>
                        <Badge variant="outline" className="text-xs">
                          {BlockchainService.formatAddress(walletInfo.address)}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={createWallet}
                          disabled={walletLoading}
                        >
                          {walletLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Create Wallet
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Blockchain Benefits */}
                {useBlockchain && walletInfo && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      This contract will be secured on the blockchain with smart contract automation, 
                      QR code verification, and transparent transaction history.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons - Same as your original */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-sky-500 hover:bg-sky-600"
              disabled={
                loading || 
                !formData.diamond_id || 
                (!formData.buyer_email && !formData.seller_email) ||
                (useBlockchain && !walletInfo)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Contract...
                </>
              ) : (
                <>
                  Create Contract
                  {useBlockchain && <Link className="ml-2 h-4 w-4" />}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}