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
import { toast } from "react-toastify";

// Import BlockchainService (we'll need to create this)
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
  const [walletInfo, setWalletInfo] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'MemoFrom', // Changed default to MemoFrom
    diamond_id: '',
    buyer_email: '', // This will be the 'To' email for MemoFrom
    seller_email: '', // This will be auto-filled with current user's email
    price: null,
    expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    // Blockchain-specific fields
    duration: 30, // days
    terms: '',
    blockchain_enabled: false
  });

  // Load current user and wallet info on component mount
  useEffect(() => {
    loadCurrentUser();
    autoConnectWallet();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setCurrentUser(userData);
        // Auto-fill seller email with current user's email
        setFormData(prev => ({ 
          ...prev, 
          seller_email: userData.email 
        }));
        
        if (userData.walletCreated) {
          setWalletInfo({
            address: userData.walletAddress,
            createdAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const autoConnectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setWalletInfo({
            address: accounts[0],
            createdAt: new Date()
          });
          console.log("MetaMask auto-connected:", accounts[0]);
        }
      } catch (err) {
        console.warn("MetaMask connection skipped or rejected.");
      }
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

    if (field === 'buyer_email') {
      setEmailError('');
    }
  };

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate buyer email (To email)
      if (formData.buyer_email && !isValidEmail(formData.buyer_email)) {
        setEmailError('Invalid email address');
        return;
      }

      setEmailError('');

      const isMemoFromContract = formData.type === 'MemoFrom';

      if (isMemoFromContract) {
        const Web3 = (await import("web3")).default;
        const DiamondLendingJSON = await import("../../abis/DiamondLending.json");
        const DiamondLendingAddress = "0xB4faE67601084B25244d3bb103c1459Fdc99B5Ff";

        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();

        const lendingContract = new web3.eth.Contract(
          DiamondLendingJSON.abi,
          DiamondLendingAddress
        );

        const selectedDiamond = diamonds.find(d => d.id === formData.diamond_id);
        console.log("selectedDiamond:", selectedDiamond);
        const diamondId = selectedDiamond?.diamondNumber;
        console.log("diamondId (uint256):", diamondId);

        if (!diamondId) {
          alert("Selected diamond is missing a valid diamondNumber.");
          setLoading(false);
          return;
        }

        if (!walletInfo?.address) {
          await autoConnectWallet(); 

          if (!walletInfo?.address) {
            alert("Please connect MetaMask before creating a contract.");
            setLoading(false);
            return;
          }
        }

        const borrower = walletInfo.address;
        const duration = Number(formData.duration);
        const terms = formData.terms;
        const qrCodeHash = web3.utils.keccak256("example");

        await lendingContract.methods
          .createLoanRequest(diamondId, borrower, duration, terms, qrCodeHash)
          .send({ from: accounts[0] });

        console.log("Memo request sent to blockchain");
      }

      const contractData = {
        ...formData,
        // Map diamond_id to diamondId for the backend
        diamondId: formData.diamond_id,
        price: (formData.type === 'Buy' || formData.type === 'Sell') ? formData.price : null,
        // For MemoFrom: buyer_email is the 'To' email, seller_email is current user
        // For Buy/Sell: keep the original logic
        buyer_email: formData.type === 'Buy' ? formData.buyer_email : 
                    formData.type === 'MemoFrom' ? formData.buyer_email : 
                    formData.type === 'Sell' ? formData.buyer_email : null,
        seller_email: formData.type === 'Sell' ? formData.buyer_email : 
                     formData.type === 'MemoFrom' ? formData.seller_email : 
                     formData.type === 'Buy' ? formData.buyer_email : null,
        blockchain_enabled: true,
        wallet_address: walletInfo?.address,
        // Remove the frontend-only field
        diamond_id: undefined
      };

      console.log("Sending contract to backend:", contractData);
      const result = await onSubmit(contractData);
      
      if (result && result.error) {
        throw new Error(result.error);
      }

      toast.success("Contract created successfully");
    } catch (error) {
      console.error("Error submitting contract:", error);
      
      // Better error handling
      let errorMessage = "Failed to create contract. Please try again.";
      
      if (error.code === 4001) {
        errorMessage = "MetaMask: Transaction was cancelled by user.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error to user
      toast.error(errorMessage);
      
      // Don't close the dialog on error so user can try again
      return;
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDiamond = () => {
    return diamonds.find(d => d.id === formData.diamond_id);
  };

  const isMemoFromContract = formData.type === 'MemoFrom';

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
          <DialogDescription>
            Set up a new contract for lending, buying, or selling diamonds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contract Type */}
          <div className="space-y-4">
            <div>
              <Label>Contract Type</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
                className="flex space-x-4 mt-2"
              >
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

            {/* Diamond Selection */}
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

            {/* To Email (for MemoFrom and Sell) */}
            {(formData.type === 'MemoFrom' || formData.type === 'Sell') && (
              <div>
                <Label htmlFor="to_email">
                  To (Email)
                </Label>
                <Input
                  id="to_email"
                  type="email"
                  required
                  value={formData.buyer_email}
                  onChange={(e) => handleChange('buyer_email', e.target.value)}
                  placeholder="Enter recipient email address"
                  className={emailError ? 'border-red-500' : ''}
                />
                {emailError && (
                  <p className="text-sm text-red-500 mt-1">{emailError}</p>
                )}
              </div>
            )}

            {/* From Email (for Buy) */}
            {formData.type === 'Buy' && (
              <div>
                <Label htmlFor="from_email">
                  From (Email)
                </Label>
                <Input
                  id="from_email"
                  type="email"
                  required
                  value={formData.buyer_email}
                  onChange={(e) => handleChange('buyer_email', e.target.value)}
                  placeholder="Enter seller email address"
                  className={emailError ? 'border-red-500' : ''}
                />
                {emailError && (
                  <p className="text-sm text-red-500 mt-1">{emailError}</p>
                )}
              </div>
            )}

            {/* Current User Email Display (for MemoFrom) */}
            {isMemoFromContract && (
              <div>
                <Label htmlFor="from_email_display">
                  From (Your Email)
                </Label>
                <Input
                  id="from_email_display"
                  type="email"
                  value={formData.seller_email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">This is automatically filled with your email</p>
              </div>
            )}

            {/* Price for Buy/Sell */}
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

            {/* Loan Duration for MemoFrom */}
            {isMemoFromContract && (
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

            {/* Terms for MemoFrom */}
            {isMemoFromContract && (
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

            {/* Expiration Date */}
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
              disabled={
                loading || 
                !formData.diamond_id || 
                !formData.buyer_email ||
                (isMemoFromContract && !formData.seller_email)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Contract...
                </>
              ) : (
                'Create Contract'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}