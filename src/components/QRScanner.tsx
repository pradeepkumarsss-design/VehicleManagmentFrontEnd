import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (vehicleNumber: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const validateVehicleNumber = (number: string): boolean => {
    // Remove all spaces for validation
    const cleanNumber = number.replace(/\s/g, '');
    
    // Indian vehicle number patterns:
    // XX##XX#### (e.g., MH12AB1234) - most common
    // XX##X#### (e.g., MH12A1234)
    // XX##XX### (e.g., MH12AB123)
    const pattern = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{3,4}$/;
    
    return pattern.test(cleanNumber);
  };

  useEffect(() => {
    if (isOpen && !cameraError && !manualEntry) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, cameraError, manualEntry]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setCameraError(false);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          startScanning();
        };
      }
    } catch (error) {
      setCameraError(true);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Camera access denied', {
          description: 'Please allow camera access in your browser settings'
        });
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        toast.error('No camera found', {
          description: 'Please connect a camera to scan QR codes'
        });
      } else {
        toast.error('Unable to access camera', {
          description: 'Please check camera permissions'
        });
      }
    }
  };

  const startScanning = () => {
    if (scanIntervalRef.current) return;
    
    setIsScanning(true);
    scanIntervalRef.current = window.setInterval(() => {
      scanQRCode();
    }, 300);
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      try {
        const data = JSON.parse(code.data);
        if (data.vehicleNumber) {
          stopScanning();
          handleQRScanned(data.vehicleNumber);
        }
      } catch (error) {
        // Invalid QR code format
        toast.error('Invalid QR code', {
          description: 'Please scan a valid parking ticket QR code'
        });
      }
    }
  };

  const handleQRScanned = (vehicleNumber: string) => {
    onScan(vehicleNumber);
    toast.success('QR Code scanned successfully', {
      description: `Found vehicle: ${vehicleNumber}`
    });
    handleClose();
  };

  const stopCamera = () => {
    stopScanning();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
    setCameraError(false);
    setManualEntry(false);
    setVehicleNumber('');
    setError('');
  };

  const handleManualSubmit = () => {
    if (!validateVehicleNumber(vehicleNumber)) {
      setError('Invalid vehicle number format');
      return;
    }
    onScan(vehicleNumber.trim());
    toast.success('Vehicle number entered', {
      description: `Searching for: ${vehicleNumber}`
    });
    handleClose();
  };

  const switchToManual = () => {
    stopCamera();
    setManualEntry(true);
  };

  const switchToCamera = () => {
    setManualEntry(false);
    setVehicleNumber('');
    setError('');
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto h-11 border-2"
      >
        <Camera className="w-4 h-4 mr-2" />
        Scan QR Code
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scan Parking Ticket QR Code</DialogTitle>
            <DialogDescription>
              {cameraError 
                ? 'Unable to access camera' 
                : 'Position the QR code within the frame'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {cameraError ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm text-amber-900">Camera access is not available</p>
                    <p className="text-xs text-amber-700">
                      Please enable camera permissions in your browser settings or enter the vehicle number manually.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-600">
                    Enter Vehicle Number
                  </label>
                  <input
                    type="text"
                    placeholder="MH 12 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => {
                      setVehicleNumber(e.target.value.toUpperCase());
                      setError('');
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center tracking-wider"
                    autoFocus
                  />
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setCameraError(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Camera Again
                  </Button>
                  <Button
                    onClick={handleManualSubmit}
                    className="flex-1"
                    disabled={!vehicleNumber.trim()}
                  >
                    Search
                  </Button>
                </div>
              </div>
            ) : manualEntry ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">
                    Enter Vehicle Number
                  </label>
                  <input
                    type="text"
                    placeholder="MH 12 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => {
                      setVehicleNumber(e.target.value.toUpperCase());
                      setError('');
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center tracking-wider"
                    autoFocus
                  />
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={switchToCamera}
                    variant="outline"
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Use Camera
                  </Button>
                  <Button
                    onClick={handleManualSubmit}
                    className="flex-1"
                    disabled={!vehicleNumber.trim()}
                  >
                    Search
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-4 border-white/70 rounded-lg w-64 h-64 flex items-center justify-center">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                      {isScanning && (
                        <span className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                          Scanning...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="absolute top-4 left-0 right-0 flex justify-center">
                    <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-full">
                      Align QR code within the frame
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <Button
                      onClick={switchToManual}
                      variant="secondary"
                    >
                      Enter Manually
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}