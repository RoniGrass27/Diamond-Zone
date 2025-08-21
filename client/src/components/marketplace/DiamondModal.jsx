import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Diamond as DiamondIcon, Building2, Calendar, DollarSign } from "lucide-react";

export default function DiamondModal({ diamond, businessName, open, onOpenChange, onPlaceBid }) {
  if (!diamond) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const handleOpenChange = (open) => {
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DiamondIcon className="h-6 w-6 text-sky-500" />
            Diamond #{diamond.diamondNumber || diamond.id?.substring(0, 3)}
          </DialogTitle>
          <DialogDescription>
            Detailed information about this diamond
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Photo Section */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border">
              {diamond.photo ? (
                <img 
                  src={diamond.photo} 
                  alt={`Diamond ${diamond.diamondNumber || diamond.id}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <DiamondIcon className="h-24 w-24 text-gray-400" />
                </div>
              )}
              {diamond.photo && (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{display: 'none'}}>
                  <DiamondIcon className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Price Section */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Price Per Carat</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                ${diamond.price?.toLocaleString() || "N/A"}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Seller Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-600" />
                Seller Information
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">{businessName}</p>
                <p className="text-sm text-gray-600">Trusted Diamond Seller</p>
              </div>
            </div>

            {/* Basic Specifications */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Basic Specifications</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Weight</p>
                  <p className="font-medium">{diamond.carat || "N/A"} Carats</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Shape</p>
                  <p className="font-medium">{diamond.shape || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Color</p>
                  <p className="font-medium">{diamond.color || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Clarity</p>
                  <p className="font-medium">{diamond.clarity || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Quality Grades */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Quality Grades</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Cut</p>
                  <p className="font-medium">{diamond.cut || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Polish</p>
                  <p className="font-medium">{diamond.polish || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Symmetry</p>
                  <p className="font-medium">{diamond.symmetry || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">UV Fluorescence</p>
                  <p className="font-medium">{diamond.uv || "N/A"}</p>
                </div>
              </div>
            </div>


          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            onClick={onPlaceBid}
            className="bg-sky-500 hover:bg-sky-600"
          >
            Place a Bid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}