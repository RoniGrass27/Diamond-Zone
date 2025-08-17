import React, { useState, useEffect } from 'react';
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
import { Contract, Diamond } from "@/api/entities";

export default function PlaceBidForm({ diamond, businessName, open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    type: 'MemoTo',
    duration: 30,
    terms: '',
    buyerEmail: '',
    sellerEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user on component mount
  useEffect(() => {
    const loadCurrentUser = () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData && userData.email) {
          setCurrentUser(userData);
          // Auto-populate buyer email with current user's email
          setFormData(prev => ({ ...prev, buyerEmail: userData.email }));
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };

    loadCurrentUser();
  }, []);

  // Auto-populate seller email when diamond data changes
  useEffect(() => {
    if (diamond && diamond.ownerId && diamond.ownerId.email) {
      setFormData(prev => ({ ...prev, sellerEmail: diamond.ownerId.email }));
    }
  }, [diamond]);

  const handleChange = (field, value) => {
    // Only allow changes to duration and terms
    if (field === 'duration' || field === 'terms') {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.buyerEmail || !formData.sellerEmail) {
      alert('Please fill in all required fields');
      return;
    }

    if (diamond.status !== "In Stock") {
      alert('This diamond is not available for bidding.');
      return;
    }

    // Debug: Log the diamond object to see its structure
    console.log('Diamond object for contract creation:', diamond);
    console.log('Diamond ID:', diamond.id);
    console.log('Diamond _id:', diamond._id);
    console.log('Diamond status:', diamond.status);
    console.log('Diamond ownerId:', diamond.ownerId);

    try {
      setLoading(true);
      
      // Create the contract
      const contractData = {
        diamondId: diamond.id || diamond._id,
        sellerId: diamond.ownerId?._id || diamond.ownerId,
        buyerEmail: formData.buyerEmail,
        sellerEmail: formData.sellerEmail,
        type: 'MemoTo', // Changed to MemoTo type for marketplace bidding
        duration: formData.duration,
        terms: formData.terms,
        status: 'pending'
      };
      
      console.log('Creating contract:', contractData);
      
      const contract = await Contract.create(contractData);
      console.log('Contract created:', contract);
      console.log('Contract response structure:', Object.keys(contract));
      
      // Update the seller's diamond status to "Memo From" and add contract info
      console.log('Updating seller diamond status to Memo From...');
      const diamondId = diamond.id || diamond._id;
      
      try {
        const updateResult = await Diamond.update(diamondId, { 
          status: 'Memo From', // Seller diamond gets "Memo From" status
          contractId: contract.id || contract._id,
          memoType: 'Memo From'
        });
        console.log('Seller diamond updated successfully:', updateResult);
        console.log('Update response structure:', Object.keys(updateResult));
        console.log('Updated diamond status:', updateResult.status);
      } catch (updateError) {
        console.error('Failed to update seller diamond status:', updateError);
        // Continue with the process even if status update fails
      }
      
      // Create a copy of the diamond for the buyer with "Memo To" status
      const buyerDiamondData = {
        diamondNumber: diamond.diamondNumber,
        carat: diamond.carat,
        shape: diamond.shape,
        color: diamond.color,
        clarity: diamond.clarity,
        cut: diamond.cut,
        polish: diamond.polish,
        symmetry: diamond.symmetry,
        uv: diamond.uv,
        price: diamond.price,
        photo: diamond.photo,
        status: 'Memo To', // Buyer diamond gets "Memo To" status
        ownerId: formData.buyerEmail,
        contractId: contract.id || contract._id,
        originalDiamondId: diamond.id,
        memoType: 'Memo To'
      };
      
      console.log('Creating buyer diamond with data:', buyerDiamondData);
      
      try {
        const buyerDiamond = await Diamond.create(buyerDiamondData);
        console.log('Buyer diamond created successfully:', buyerDiamond);
        console.log('Buyer diamond response structure:', Object.keys(buyerDiamond));
        console.log('Buyer diamond status:', buyerDiamond.status);
      } catch (createError) {
        console.error('Failed to create buyer diamond:', createError);
        // Continue with the process even if buyer diamond creation fails
      }
      
      // Verify the status was updated
      console.log('Contract creation completed successfully!');
      console.log('Contract ID:', contract.id || contract._id);
      console.log('Seller diamond should now have status: Memo From');
      console.log('Buyer diamond should now exist with status: Memo To');
      
      // Add a small delay to ensure backend processing is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Contract created successfully! The diamond status has been updated.');
      onSuccess();
      
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract. Please try again.');
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
          {diamond.status !== "In Stock" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
              <p className="text-sm text-amber-800">
                ⚠️ This diamond is currently not available for bidding (Status: {diamond.status})
              </p>
            </div>
          )}
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
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 font-medium">MemoTo</p>
                  <p className="text-xs text-blue-600 mt-1">Diamond lending contract</p>
                </div>
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
                disabled
                className="bg-gray-100 cursor-not-allowed"
                placeholder="Automatically filled with your email"
              />
              <p className="text-xs text-gray-500">Your email (cannot be changed)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerEmail">Seller Email *</Label>
              <Input
                id="sellerEmail"
                type="email"
                value={formData.sellerEmail}
                disabled
                className="bg-gray-100 cursor-not-allowed"
                placeholder="Automatically filled with diamond owner's email"
              />
              <p className="text-xs text-gray-500">Diamond owner's email (cannot be changed)</p>
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
              disabled={loading || diamond.status !== "In Stock"}
              className={`${
                diamond.status === "In Stock" 
                  ? "bg-sky-500 hover:bg-sky-600" 
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Bid Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}