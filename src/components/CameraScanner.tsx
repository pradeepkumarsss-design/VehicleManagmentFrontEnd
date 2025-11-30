import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Camera, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CameraScannerProps {
  onCapture: (vehicleNumber: string) => void;
}

export function CameraScanner({ onCapture }: CameraScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && !stream && !cameraError && !capturedImage && !isRequestingCamera) {
      setIsRequestingCamera(true);
      startCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(false);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video plays
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('Error playing video:', err);
          });
        };
      }
    } catch (error) {
      setCameraError(true);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          toast.error('Camera Access Denied', {
            description: 'Please allow camera access in your browser settings to scan vehicle numbers.',
            duration: 5000
          });
          // Don't log permission denial - this is expected user behavior
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          toast.error('No Camera Found', {
            description: 'No camera device detected. Please connect a camera or enter manually.',
            duration: 5000
          });
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          toast.error('Camera Busy', {
            description: 'Camera is already in use by another application. Please close it and try again.',
            duration: 5000
          });
        } else if (error.message === 'Camera API not supported') {
          toast.error('Camera Not Supported', {
            description: 'Your browser does not support camera access. Please use a modern browser.',
            duration: 5000
          });
        } else {
          toast.error('Camera Error', {
            description: 'Unable to access camera. Please check permissions or enter manually.',
            duration: 5000
          });
          // Only log unexpected errors
          console.error('Camera error:', error);
        }
      }
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        
        // Stop camera after capture
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setVehicleNumber('');
    setCameraError(false);
    setIsRequestingCamera(true);
    startCamera();
  };

  const handleConfirm = () => {
    if (vehicleNumber.trim()) {
      onCapture(vehicleNumber.toUpperCase());
      handleClose();
      toast.success('Vehicle number captured!');
    } else {
      toast.error('Please enter the vehicle number');
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setVehicleNumber('');
    setCameraError(false);
    setIsRequestingCamera(false);
    setIsOpen(false);
  };

  const handleTryAgain = () => {
    setCameraError(false);
    setIsRequestingCamera(true);
    startCamera();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full h-12 border-2 border-dashed hover:border-blue-500 hover:bg-blue-50"
      >
        <Camera className="w-5 h-5 mr-2" />
        Scan Vehicle Number
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scan Vehicle Number</DialogTitle>
            <DialogDescription>
              {cameraError 
                ? 'Enter the vehicle number manually' 
                : 'Capture the vehicle\'s license plate and enter the number'}
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
                      Please enable camera permissions in your browser settings or enter the vehicle number manually below.
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
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center tracking-wider"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleTryAgain}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Camera Again
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1"
                    disabled={!vehicleNumber.trim()}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm
                  </Button>
                </div>
              </div>
            ) : !capturedImage ? (
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white/50 rounded-lg w-4/5 h-1/3 flex items-center justify-center">
                    <span className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                      Align license plate here
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                  <Button
                    onClick={() => setCameraError(true)}
                    variant="secondary"
                  >
                    Enter Manually
                  </Button>
                  <Button
                    onClick={captureImage}
                    size="lg"
                    className="rounded-full w-16 h-16"
                  >
                    <Camera className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured vehicle"
                    className="w-full h-auto"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-600">
                    Enter Vehicle Number
                  </label>
                  <input
                    type="text"
                    placeholder="MH 12 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center tracking-wider"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={retake}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1"
                    disabled={!vehicleNumber.trim()}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}