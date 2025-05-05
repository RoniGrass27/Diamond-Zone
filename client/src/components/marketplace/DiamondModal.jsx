import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Tag, Diamond as DiamondIcon } from "lucide-react";

export default function DiamondModal({ diamond, open, onOpenChange, onPlaceBid, currentUser }) {
  if (!diamond) return null;

  const canPlaceBid = 
    diamond.status === "In Stock" && 
    diamond.owner !== currentUser?.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Diamond Details</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Diamond Image */}
          <div className="md:w-1/3">
            <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square flex items-center justify-center">
              {diamond.image_url ? (
                <img 
                  src={diamond.image_url} 
                  alt={diamond.name || "Diamond"} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <DiamondIcon className="h-24 w-24 text-gray-300" />
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
              <Badge 
                className={
                  diamond.status === "In Stock" ? "bg-green-100 text-green-800" :
                  diamond.status === "Borrowed" ? "bg-amber-100 text-amber-800" :
                  diamond.status === "Sold" ? "bg-gray-100 text-gray-800" :
                  "bg-blue-100 text-blue-800"
                }
              >
                {diamond.status || "For Sale"}
              </Badge>
              
              {diamond.owner === currentUser?.email && (
                <Badge variant="outline" className="border-sky-200 text-sky-800 bg-sky-50">
                  Your Diamond
                </Badge>
              )}
            </div>
            
            {canPlaceBid && (
              <Button 
                className="w-full mt-4 bg-sky-500 hover:bg-sky-600"
                onClick={onPlaceBid}
              >
                <Tag className="mr-2 h-4 w-4" />
                Place a Bid
              </Button>
            )}
          </div>
          
          {/* Diamond Details */}
          <div className="md:w-2/3">
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                {diamond.name || `Diamond ${diamond.id.substring(0, 4)}`}
              </h2>
              <div className="flex justify-between items-baseline mt-1">
                <p className="text-gray-500">
                  {diamond.carat || "0.71"} Carat • {diamond.cut || "Ideal Cut"}
                </p>
                <p className="text-xl font-bold text-sky-600">
                  ${diamond.price?.toLocaleString() || "326"}
                </p>
              </div>
            </div>
            
            <Tabs defaultValue="specifications">
              <TabsList className="mb-4">
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="certificate">Certificate</TabsTrigger>
              </TabsList>
              
              <TabsContent value="specifications">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Carat Weight</p>
                      <p className="font-medium">{diamond.carat || "0.71"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cut</p>
                      <p className="font-medium">{diamond.cut || "Ideal"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Color</p>
                      <p className="font-medium">{diamond.color || "D"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Clarity</p>
                      <p className="font-medium">{diamond.clarity || "VS1"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Polish</p>
                      <p className="font-medium">{diamond.polish || "Excellent"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Symmetry</p>
                      <p className="font-medium">{diamond.symmetry || "Excellent"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Depth %</p>
                      <p className="font-medium">{diamond.depth || "61.5"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Table %</p>
                      <p className="font-medium">{diamond.table || "55"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Length (mm)</p>
                      <p className="font-medium">{diamond.length_mm || "3.95"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Width (mm)</p>
                      <p className="font-medium">{diamond.width_mm || "3.98"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">UV Fluorescence</p>
                      <p className="font-medium">{diamond.uv || "None"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium">{diamond.status || "In Stock"}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="certificate">
                {diamond.certificate_url ? (
                  <div className="flex flex-col items-center">
                    <FileText className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="mb-4">View the diamond's certificate for detailed information.</p>
                    <a 
                      href={diamond.certificate_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button>View Certificate</Button>
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No certificate available for this diamond.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}