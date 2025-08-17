import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter,
  SortAsc,
  SortDesc,
  Diamond as DiamondIcon,
  Eye
} from "lucide-react";
import { Diamond } from "@/api/entities";
import DiamondModal from "../components/marketplace/DiamondModal";
import PlaceBidForm from "../components/marketplace/PlaceBidForm";

export default function Marketplace() {
  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("In Stock");
  const [sortBy, setSortBy] = useState("price");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedDiamond, setSelectedDiamond] = useState(null);
  const [showDiamondModal, setShowDiamondModal] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading marketplace data...');
      
      // Load all diamonds with populated owner information
      const diamondsData = await Diamond.listAll();
      console.log('Marketplace diamonds loaded:', diamondsData);
      console.log('Number of diamonds:', diamondsData?.length || 0);
      
      if (diamondsData && diamondsData.length > 0) {
        console.log('First diamond sample:', diamondsData[0]);
      }
      
      setDiamonds(diamondsData || []);
    } catch (error) {
      console.error("Error loading marketplace data:", error);
      setDiamonds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDiamondClick = (diamond) => {
    setSelectedDiamond(diamond);
    setShowDiamondModal(true);
  };

  const handlePlaceBid = (diamond) => {
    setSelectedDiamond(diamond);
    setShowBidForm(true);
  };

  const getBusinessName = (ownerId) => {
    if (ownerId && typeof ownerId === 'object' && ownerId.businessName) {
      return ownerId.businessName;
    }
    if (ownerId && typeof ownerId === 'object' && ownerId.fullName) {
      return ownerId.fullName;
    }
    return "Unknown Seller";
  };

  const filteredAndSortedDiamonds = diamonds
    .filter(diamond => {
      const matchesSearch = 
        searchQuery === "" || 
        (diamond.diamondNumber && String(diamond.diamondNumber).includes(searchQuery)) ||
        (diamond.shape && diamond.shape.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (diamond.color && diamond.color.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = diamond.status === "In Stock"; // Only show diamonds that are available for bidding
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle numeric values
      if (sortBy === "price" || sortBy === "carat") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      // Handle string values
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Debug logging
  console.log('Total diamonds:', diamonds.length);
  console.log('Filtered diamonds:', filteredAndSortedDiamonds.length);
  console.log('Search query:', searchQuery);
  console.log('Filter status:', filterStatus);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trending Stones</h1>
          <p className="text-gray-500">Browse and bid on diamonds from trusted sellers</p>
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between flex-wrap gap-4">
              <CardTitle>Available Diamonds</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search diamonds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[200px] pl-9"
                  />
                </div>
                


                <Button
                  variant="outline"
                  onClick={toggleSortOrder}
                  className="flex items-center gap-2"
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  Sort
                </Button>

                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-md p-2 text-sm"
                >
                  <option value="price">Price</option>
                  <option value="carat">Carat</option>
                  <option value="diamondNumber">Diamond #</option>
                  <option value="createdAt">Date Added</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading diamonds...</div>
            ) : filteredAndSortedDiamonds.length === 0 ? (
              <div className="text-center py-12">
                <DiamondIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No diamonds found</h3>
                <p className="mt-1 text-gray-500">No diamonds match your current filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedDiamonds.map((diamond) => (
                  <Card 
                    key={diamond.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    onClick={() => handleDiamondClick(diamond)}
                  >
                    <div className="aspect-square overflow-hidden rounded-t-lg">
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
                          <DiamondIcon className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      {diamond.photo && (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{display: 'none'}}>
                          <DiamondIcon className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">
                            Diamond {diamond.diamondNumber || diamond.id?.substring(0, 3)}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              diamond.status === "In Stock" 
                                ? "bg-green-100 text-green-800" 
                                : diamond.status === "Memo From"
                                ? "bg-blue-100 text-blue-800"
                                : diamond.status === "Memo To"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {diamond.status || "In Stock"}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          {getBusinessName(diamond.ownerId)}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Carat:</span>
                            <span className="ml-1">{diamond.carat || "-"}</span>
                          </div>
                          <div>
                            <span className="font-medium">Cut:</span>
                            <span className="ml-1">{diamond.cut || "-"}</span>
                          </div>
                          <div>
                            <span className="font-medium">Color:</span>
                            <span className="ml-1">{diamond.color || "-"}</span>
                          </div>
                          <div>
                            <span className="font-medium">Clarity:</span>
                            <span className="ml-1">{diamond.clarity || "-"}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="text-lg font-bold text-green-600">
                            ${diamond.price?.toLocaleString() || "-"}
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlaceBid(diamond);
                            }}
                            disabled={diamond.status !== "In Stock"}
                            className={`${
                              diamond.status === "In Stock" 
                                ? "bg-sky-500 hover:bg-sky-600" 
                                : "bg-gray-300 cursor-not-allowed"
                            }`}
                          >
                            {diamond.status === "In Stock" ? "Place a Bid" : "Not Available"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diamond Detail Modal */}
      {showDiamondModal && (
        <DiamondModal
          diamond={selectedDiamond}
          businessName={getBusinessName(selectedDiamond?.ownerId)}
          open={showDiamondModal}
          onOpenChange={setShowDiamondModal}
          onPlaceBid={() => {
            setShowDiamondModal(false);
            setShowBidForm(true);
          }}
        />
      )}

      {/* Place Bid Form */}
      {showBidForm && (
        <PlaceBidForm
          diamond={selectedDiamond}
          businessName={getBusinessName(selectedDiamond?.ownerId)}
          open={showBidForm}
          onOpenChange={setShowBidForm}
          onSuccess={() => {
            setShowBidForm(false);
            setSelectedDiamond(null);
            loadMarketplaceData(); // Refresh the marketplace data to show status changes
          }}
        />
      )}
    </div>
  );
}
