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
import { Diamond } from "@/api/entities";

export default function PhotoUploadDialog({ diamond, open, onOpenChange, onPhotoUploaded }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploading, setUploading] = useState(false);

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
      };
      
      img.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!photoFile) {
      alert('Please select a photo first');
      return;
    }

    try {
      setUploading(true);
      
      // Use the compressed preview data instead of reading the file again
      if (photoPreview) {
        // Update the diamond with the compressed photo
        await Diamond.update(diamond.id, { photo: photoPreview });
        
        setUploading(false);
        onPhotoUploaded();
        onOpenChange(false);
        
        // Reset form
        setPhotoFile(null);
        setPhotoPreview('');
      } else {
        throw new Error('No compressed photo data available');
      }
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploading(false);
      alert('Failed to upload photo. Please try again.');
    }
  };

  const handleCancel = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Diamond Photo</DialogTitle>
          <DialogDescription>
            Add a photo for diamond #{diamond?.diamondNumber || diamond?.id?.substring(0, 3)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="photo">Select Photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-500">
              Supported formats: JPG, PNG, GIF. Large images will be automatically compressed.
            </p>
          </div>
          
          {photoPreview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img 
                  src={photoPreview} 
                  alt="Diamond preview" 
                  className="max-w-full h-32 object-contain mx-auto rounded"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!photoFile || uploading}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
