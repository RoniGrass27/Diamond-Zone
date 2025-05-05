import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { Diamond as DiamondIcon } from "lucide-react";

export default function PlaceBidForm({ diamond, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    amount: diamond?.price || "",
    message: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-md">
        <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden">
          {diamond?.image_url ? (
            <img 
              src={diamond.image_url} 
              alt={diamond.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <DiamondIcon className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <div>
          <h3 className="font-medium">
            {diamond?.name || `Diamond ${diamond?.id?.substring(0, 4)}`}
          </h3>
          <p className="text-sm text-gray-500">
            {diamond?.carat || "0.71"} Carat • {diamond?.clarity || "VS1"}
          </p>
        </div>
        <div className="ml-auto">
          <p className="text-sm text-gray-500">List Price</p>
          <p className="font-bold">${diamond?.price?.toLocaleString() || "326"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Your Bid (USD)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          placeholder="Enter your bid amount"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message (Optional)</Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Add a message to the seller"
          rows={3}
        />
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
          Place Bid
        </Button>
      </DialogFooter>
    </form>
  );
}