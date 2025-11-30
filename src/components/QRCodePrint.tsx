import { useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Printer, X } from 'lucide-react';
import { Vehicle } from '../App';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface QRCodePrintProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodePrint({ vehicle, isOpen, onClose }: QRCodePrintProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (vehicle && isOpen) {
      generateQRCode();
    }
  }, [vehicle, isOpen]);

  const generateQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        ownerName: vehicle.ownerName,
        phoneNumber: vehicle.phoneNumber,
        checkInTime: vehicle.checkInTime.toISOString(),
        id: vehicle.id
      });
      
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && printRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Vehicle Parking Ticket</title>
            <style>
              @media print {
                @page {
                  margin: 0.5in;
                }
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                }
              }
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
              }
              .ticket {
                border: 2px solid #000;
                padding: 30px;
                max-width: 400px;
                text-align: center;
              }
              .header {
                border-bottom: 2px solid #000;
                padding-bottom: 15px;
                margin-bottom: 20px;
              }
              .header h1 {
                margin: 0 0 5px 0;
                font-size: 24px;
              }
              .header p {
                margin: 0;
                font-size: 14px;
                color: #666;
              }
              .details {
                margin: 20px 0;
                text-align: left;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px dashed #ccc;
              }
              .detail-label {
                font-weight: bold;
                color: #333;
              }
              .detail-value {
                color: #666;
              }
              .qr-section {
                margin: 20px 0;
                padding: 20px;
                background: #f9f9f9;
                border-radius: 8px;
              }
              .qr-section img {
                width: 250px;
                height: 250px;
              }
              .footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 2px solid #000;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Parking Ticket</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Scan this QR code for vehicle details
          </DialogDescription>
        </DialogHeader>

        <div ref={printRef}>
          <div className="border-2 border-slate-900 rounded-lg p-3 sm:p-4">
            <div className="border-b-2 border-slate-900 pb-2 sm:pb-3 mb-3 sm:mb-4 text-center">
              <h1 className="text-base sm:text-lg mb-1">Vehicle Parking Ticket</h1>
              <p className="text-xs text-slate-600">Please keep this for checkout</p>
            </div>

            <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
              <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-300 text-xs sm:text-sm">
                <span className="text-slate-700">Vehicle Number:</span>
                <span className="text-slate-900">{vehicle.vehicleNumber}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-300 text-xs sm:text-sm">
                <span className="text-slate-700">Vehicle Type:</span>
                <span className="text-slate-900">{vehicle.vehicleType}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-300 text-xs sm:text-sm">
                <span className="text-slate-700">Owner Name:</span>
                <span className="text-slate-900">{vehicle.ownerName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-300 text-xs sm:text-sm">
                <span className="text-slate-700">Phone Number:</span>
                <span className="text-slate-900">{vehicle.phoneNumber}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-dashed border-slate-300 text-xs sm:text-sm">
                <span className="text-slate-700">Check-in Time:</span>
                <span className="text-slate-900 text-right text-xs">{formatDateTime(vehicle.checkInTime)}</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 flex justify-center">
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="Vehicle QR Code" 
                  className="w-36 h-36 sm:w-44 sm:h-44"
                />
              )}
            </div>

            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t-2 border-slate-900 text-center text-xs text-slate-600">
              <p>Parking Rate: ₹10 for up to 12 hours</p>
              <p>₹20 per 24-hour period thereafter</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 h-10">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          <Button onClick={handlePrint} className="flex-1 h-10">
            <Printer className="w-4 h-4 mr-2" />
            Print Ticket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}