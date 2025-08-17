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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DiamondForm({ diamond, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    carat: diamond?.carat || '',
    shape: diamond?.shape || '',
    color: diamond?.color || '',
    clarity: diamond?.clarity || '',
    cut: diamond?.cut || '',
    polish: diamond?.polish || '',
    symmetry: diamond?.symmetry || '',
    uv: diamond?.uv || '',
    status: diamond?.status || 'In Stock',
    price: diamond?.price || '',
    photo: diamond?.photo || ''
  });

  // Ensure status is always "In Stock" for new diamonds
  React.useEffect(() => {
    if (!diamond) {
      setFormData(prev => ({ ...prev, status: 'In Stock' }));
    }
  }, [diamond]);

  const [currentTab, setCurrentTab] = useState("basic");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(diamond?.photo || '');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      
      // Compress the image before creating preview
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800x800)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        
        setPhotoPreview(compressedDataUrl);
        setFormData(prev => ({ ...prev, photo: compressedDataUrl }));
      };
      
      img.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert numeric fields
    const processedData = {
      ...formData,
      carat: formData.carat ? parseFloat(formData.carat) : null,
      price: formData.price ? parseFloat(formData.price) : null
    };
    
    onSubmit(processedData);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{diamond ? 'Edit Diamond' : 'Add New Diamond'}</DialogTitle>
          <DialogDescription>
            {diamond 
              ? 'Update the details of this diamond' 
              : 'Enter the details to add a new diamond to your inventory'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Tabs defaultValue="basic" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="photo">Photo</TabsTrigger>
              <TabsTrigger value="status">Status & Price</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carat">Weight (Carats)</Label>
                    <Input
                      id="carat"
                      type="number"
                      step="0.01"
                      value={formData.carat}
                      onChange={(e) => handleChange('carat', e.target.value)}
                      placeholder="e.g., 1.25"
                    />
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="shape">Shape</Label>
                    <Select
                      value={formData.shape}
                      onValueChange={(value) => handleChange('shape', value)}
                    >
                      <SelectTrigger id="shape">
                        <SelectValue placeholder="Select shape" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Round">Round</SelectItem>
                        <SelectItem value="Princess">Princess</SelectItem>
                        <SelectItem value="Cushion">Cushion</SelectItem>
                        <SelectItem value="Emerald">Emerald</SelectItem>
                        <SelectItem value="Oval">Oval</SelectItem>
                        <SelectItem value="Pear">Pear</SelectItem>
                        <SelectItem value="Marquise">Marquise</SelectItem>
                        <SelectItem value="Radiant">Radiant</SelectItem>
                        <SelectItem value="Asscher">Asscher</SelectItem>
                        <SelectItem value="Heart">Heart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) => handleChange('color', value)}
                    >
                      <SelectTrigger id="color">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="H">H</SelectItem>
                        <SelectItem value="I">I</SelectItem>
                        <SelectItem value="J">J</SelectItem>
                        <SelectItem value="K">K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="clarity">Clarity</Label>
                    <Select
                      value={formData.clarity}
                      onValueChange={(value) => handleChange('clarity', value)}
                    >
                      <SelectTrigger id="clarity">
                        <SelectValue placeholder="Select clarity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FL">FL</SelectItem>
                        <SelectItem value="IF">IF</SelectItem>
                        <SelectItem value="VVS1">VVS1</SelectItem>
                        <SelectItem value="VVS2">VVS2</SelectItem>
                        <SelectItem value="VS1">VS1</SelectItem>
                        <SelectItem value="VS2">VS2</SelectItem>
                        <SelectItem value="SI1">SI1</SelectItem>
                        <SelectItem value="SI2">SI2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setCurrentTab("quality")}>
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cut">Cut</Label>
                    <Select
                      value={formData.cut}
                      onValueChange={(value) => handleChange('cut', value)}
                    >
                      <SelectTrigger id="cut">
                        <SelectValue placeholder="Select cut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ideal">Ideal</SelectItem>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Very Good">Very Good</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="polish">Polish</Label>
                    <Select
                      value={formData.polish}
                      onValueChange={(value) => handleChange('polish', value)}
                    >
                      <SelectTrigger id="polish">
                        <SelectValue placeholder="Select polish" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Very Good">Very Good</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symmetry">Symmetry</Label>
                    <Select
                      value={formData.symmetry}
                      onValueChange={(value) => handleChange('symmetry', value)}
                    >
                      <SelectTrigger id="symmetry">
                        <SelectValue placeholder="Select symmetry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Very Good">Very Good</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="uv">UV Fluorescence</Label>
                    <Select
                      value={formData.uv}
                      onValueChange={(value) => handleChange('uv', value)}
                    >
                      <SelectTrigger id="uv">
                        <SelectValue placeholder="Select UV fluorescence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Faint">Faint</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Strong">Strong</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setCurrentTab("basic")}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setCurrentTab("photo")}>
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photo" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="photo">Diamond Photo</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-gray-500">
                      Upload a photo of your diamond. Supported formats: JPG, PNG, GIF. 
                      Large images will be automatically compressed for optimal performance.
                    </p>
                  </div>
                  
                  {photoPreview && (
                    <div className="space-y-2">
                      <Label>Photo Preview</Label>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <img 
                          src={photoPreview} 
                          alt="Diamond preview" 
                          className="max-w-full h-48 object-contain mx-auto rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setCurrentTab("quality")}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setCurrentTab("status")}>
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="status" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange('status', value)}
                      disabled={!diamond} // Disable for new diamonds
                    >
                      <SelectTrigger id="status" className={!diamond ? "opacity-50 cursor-not-allowed" : ""}>
                        <SelectValue placeholder={diamond ? "Select status" : "In Stock"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In Stock">In Stock</SelectItem>
                        <SelectItem value="Borrowed">Borrowed</SelectItem>
                        <SelectItem value="Sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      placeholder="e.g., 5000"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setCurrentTab("photo")}>
                    Back
                  </Button>
                  <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                    {diamond ? 'Update Diamond' : 'Add Diamond'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}