import React, { useState, useEffect } from "react";
import { User, Diamond } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Diamond as DiamondIcon,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  Download,
  Camera
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

import DiamondForm from "../components/inventory/DiamondForm";
import DeleteConfirmDialog from "../components/inventory/DeleteConfirmDialog";
import PhotoUploadDialog from "../components/inventory/PhotoUploadDialog";

export default function Inventory() {
  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [selectedDiamond, setSelectedDiamond] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadDiamonds();
  }, []);

  const loadDiamonds = async () => {
    try {
      setLoading(true);
      const data = await Diamond.list();
      setDiamonds(data);
    } catch (error) {
      console.error("Error loading diamonds:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiamond = async (diamondData) => {
    try {
      // Create the new diamond
      await Diamond.create(diamondData);
      
      // Refresh the diamonds list
      await loadDiamonds();
      
      // Close the dialog
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding diamond:", error);
    }
  };

  const handleEditDiamond = (diamond) => {
    setSelectedDiamond(diamond);
    setShowAddDialog(true);
  };

  const handleUpdateDiamond = async (diamondData) => {
    try {
      await Diamond.update(selectedDiamond.id, diamondData);
      await loadDiamonds();
      setShowAddDialog(false);
      setSelectedDiamond(null);
    } catch (error) {
      console.error("Error updating diamond:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await Diamond.delete(selectedDiamond.id);
      await loadDiamonds();
      setShowDeleteDialog(false);
      setSelectedDiamond(null);
    } catch (error) {
      console.error("Error deleting diamond:", error);
    }
  };

  const handleDeleteClick = (diamond) => {
    setSelectedDiamond(diamond);
    setShowDeleteDialog(true);
  };

  const handlePhotoUpload = (diamond) => {
    setSelectedDiamond(diamond);
    setShowPhotoDialog(true);
  };

  const exportToCsv = () => {
    const headers = ['Diamond #', 'Photo', 'Weight', 'Shape', 'Color', 'Clarity', 'Cut', 'Polish', 'Symmetry', 'UV', 'Status', 'Price'];
    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.join(',') + "\n" +
      diamonds.map(d => 
        `${d.diamondNumber || ''},${d.photo ? 'Yes' : 'No'},${d.carat || ''},${d.shape || ''},${d.color || ''},${d.clarity || ''},` +
        `${d.cut || ''},${d.polish || ''},${d.symmetry || ''},${d.uv || ''},${d.status || ''},${d.price || ''}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'diamond_inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDiamonds = diamonds.filter(diamond => {
    const matchesSearch = 
      searchQuery === "" || 
       (diamond.diamondNumber && String(diamond.diamondNumber).includes(searchQuery))
    
    const matchesStatus = 
      filterStatus === "all" || 
      diamond.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Diamond Inventory</h1>
          <p className="text-gray-500">Manage your diamond collection</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={exportToCsv}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            onClick={() => {
              setSelectedDiamond(null);
              setShowAddDialog(true);
            }}
            className="bg-sky-500 hover:bg-sky-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Diamond
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between flex-wrap gap-4">
              <CardTitle>Diamond Collection</CardTitle>
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
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border rounded-md p-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Borrowed">Borrowed</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading diamonds...</div>
            ) : filteredDiamonds.length === 0 ? (
              <div className="text-center py-12">
                <DiamondIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No diamonds found</h3>
                <p className="mt-1 text-gray-500">Get started by adding your first diamond to your inventory.</p>
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      setSelectedDiamond(null);
                      setShowAddDialog(true);
                    }}
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Diamond
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diamond #</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (carats)</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shape</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clarity</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cut</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Polish</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symmetry</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UV</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price ($)</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDiamonds.map((diamond) => (
                      <tr key={diamond.id}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <DiamondIcon className="h-4 w-4 text-sky-500" />
                            </div>
                            <div className="ml-3 text-sm font-medium text-gray-900">
                              {diamond.diamondNumber 
                                ? `#${String(diamond.diamondNumber).padStart(3, '0')}` 
                                : `${diamond.id.substring(0, 3)}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {diamond.photo ? (
                            <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden border">
                              <img 
                                src={diamond.photo} 
                                alt={`Diamond ${diamond.diamondNumber || diamond.id}`}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="h-full w-full bg-gray-100 flex items-center justify-center" style={{display: 'none'}}>
                                <DiamondIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <DiamondIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {diamond.carat}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {diamond.shape || "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {diamond.color || "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {diamond.clarity || "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {diamond.cut || "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {diamond.polish || "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {diamond.symmetry || "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {diamond.uv || "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              diamond.status === "In Stock" 
                                ? "bg-green-100 text-green-800" 
                                : diamond.status === "Borrowed"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {diamond.status || "In Stock"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${diamond.price?.toLocaleString() || "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDiamond(diamond)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePhotoUpload(diamond)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(diamond)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Diamond Dialog */}
      {showAddDialog && (
        <DiamondForm
          diamond={selectedDiamond}
          onSubmit={selectedDiamond ? handleUpdateDiamond : handleAddDiamond}
          onCancel={() => {
            setShowAddDialog(false);
            setSelectedDiamond(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        diamond={selectedDiamond}
      />

      {/* Photo Upload Dialog */}
      <PhotoUploadDialog
        diamond={selectedDiamond}
        open={showPhotoDialog}
        onOpenChange={setShowPhotoDialog}
        onPhotoUploaded={loadDiamonds}
      />
    </div>
  );
}