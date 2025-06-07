import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  QrCode,
  Diamond as DiamondIcon
} from "lucide-react";
import jsQR from 'jsqr';
import BlockchainService from "@/services/BlockchainService";

export default function QRScanner({ open, onOpenChange, onScanSuccess, type = "loan_approval" }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [open]);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        startScanning();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsScanning(false);
  };

  const startScanning = () => {
    intervalRef.current = setInterval(() => {
      captureFrame();
    }, 100); // Scan every 100ms
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        handleQRDetected(code.data);
      }
    }
  };

  const handleQRDetected = async (data) => {
    setIsScanning(false);
    stopCamera();
    
    try {
      setProcessing(true);
      console.log('QR Code detected:', data);
      
      // Parse QR code data
      const qrData = JSON.parse(data);
      setScannedData(qrData);
      
      // Verify QR code with blockchain service
      const verification = await BlockchainService.verifyQRCode(data, qrData.hash);
      setVerificationResult(verification);
      
      if (verification.valid) {
        // Call success callback with verified data
        if (onScanSuccess) {
          onScanSuccess(qrData, verification);
        }
      }
      
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Invalid QR code format or verification failed');
      setVerificationResult({ valid: false, error: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setVerificationResult(null);
    setError('');
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
  };

  const formatQRData = (data) => {
    if (!data) return null;
    
    switch (data.type) {
      case 'LOAN_REQUEST':
        return {
          title: 'Loan Request',
          icon: <DiamondIcon className="h-5 w-5" />,
          details: [
            { label: 'Diamond Token ID', value: data.data.diamondTokenId },
            { label: 'Lender', value: BlockchainService.formatAddress(data.data.lender) },
            { label: 'Duration', value: `${data.data.duration} days` },
            { label: 'Terms', value: data.data.terms || 'Standard terms' }
          ]
        };
      default:
        return {
          title: 'Transaction',
          icon: <QrCode className="h-5 w-5" />,
          details: [
            { label: 'Type', value: data.type },
            { label: 'Timestamp', value: new Date(data.timestamp).toLocaleString() }
          ]
        };
    }
  };

  const qrInfo = scannedData ? formatQRData(scannedData) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </DialogTitle>
          <DialogDescription>
            {type === 'loan_approval' 
              ? 'Scan the QR code to approve the loan request'
              : 'Scan a QR code to proceed with the transaction'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Preview */}
          {!scannedData && (
            <div className="relative">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                {isScanning ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-sky-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-sky-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-sky-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-sky-500 rounded-br-lg"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Camera loading...</p>
                    </div>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Processing State */}
          {processing && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Processing QR code...</p>
            </div>
          )}

          {/* Scanned Data Display */}
          {scannedData && !processing && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {qrInfo?.icon}
                  {qrInfo?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {qrInfo?.details.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{detail.label}:</span>
                    <span className="text-sm font-medium">{detail.value}</span>
                  </div>
                ))}
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    {verificationResult ? (
                      <Badge 
                        variant={verificationResult.valid ? "default" : "destructive"}
                        className={verificationResult.valid ? "bg-green-100 text-green-800" : ""}
                      >
                        {verificationResult.valid ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Invalid
                          </>
                        )}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Verifying...
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Verification Result */}
          {verificationResult && !verificationResult.valid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                QR code verification failed: {verificationResult.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            {scannedData ? (
              <>
                <Button variant="outline" onClick={resetScanner}>
                  Scan Again
                </Button>
                <Button onClick={handleClose}>
                  Close
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}