import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CameraScanner } from './CameraScanner';
import { QRCodePrint } from './QRCodePrint';
import { Vehicle } from '../App';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface VehicleCheckinProps {
  onCheckin: (data: Omit<Vehicle, 'id' | 'checkInTime' | 'status'>) => boolean;
}

export function VehicleCheckin({ onCheckin }: VehicleCheckinProps) {
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: '',
    ownerName: '',
    phoneNumber: ''
  });
  
  const [showQRCode, setShowQRCode] = useState(false);
  const [lastCheckedInVehicle, setLastCheckedInVehicle] = useState<Vehicle | null>(null);
  const [errors, setErrors] = useState({
    vehicleNumber: '',
    phoneNumber: ''
  });

  const validateVehicleNumber = (number: string): boolean => {
    const cleanNumber = number.replace(/\s/g, '');
    const pattern = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{3,4}$/;
    return pattern.test(cleanNumber);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const pattern = /^[6-9]\d{9}$/;
    return pattern.test(phone);
  };

  const handleVehicleNumberChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setFormData({ ...formData, vehicleNumber: upperValue });
    if (upperValue && !validateVehicleNumber(upperValue)) {
      setErrors(prev => ({ ...prev, vehicleNumber: 'Invalid vehicle number format (e.g., MH 12 AB 1234)' }));
    } else {
      setErrors(prev => ({ ...prev, vehicleNumber: '' }));
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    const digitsOnly = (value || '').replace(/\D/g, '');
    setFormData({ ...formData, phoneNumber: digitsOnly });
    if (digitsOnly && !validatePhoneNumber(digitsOnly)) {
      setErrors(prev => ({ ...prev, phoneNumber: 'Invalid phone number (10 digits, starting with 6-9)' }));
    } else {
      setErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicleNumber || !formData.vehicleType || !formData.ownerName || !formData.phoneNumber) {
      toast.error('Please fill all fields');
      return;
    }

    if (!validateVehicleNumber(formData.vehicleNumber)) {
      toast.error('Invalid vehicle number format');
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      toast.error('Invalid phone number');
      return;
    }

    try {
      // -----------------------------
      // CALL NODE.JS INSERT API
      // -----------------------------
      const response = await fetch('http://localhost:5000/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Vehicle check-in failed');
        return;
      }

      // Optional: still call your onCheckin if needed
      const checkinSuccess = onCheckin(formData);
      if (!checkinSuccess) return;

      const checkedInVehicle: Vehicle = {
        ...formData,
        id: Date.now().toString(),
        checkInTime: new Date(),
        status: 'active' as const
      };

      setLastCheckedInVehicle(checkedInVehicle);
      setShowQRCode(true);

      toast.success('Vehicle checked in successfully!', {
        description: `${formData.vehicleNumber} has been parked`
      });

      setFormData({
        vehicleNumber: '',
        vehicleType: '',
        ownerName: '',
        phoneNumber: ''
      });
      setErrors({
        vehicleNumber: '',
        phoneNumber: ''
      });

    } catch (err) {
      console.error(err);
      toast.error('Server error: Unable to save vehicle');
    }
  };

  const handleCameraCapture = (scannedNumber: string) => {
    setFormData({ ...formData, vehicleNumber: scannedNumber });
    toast.success('Vehicle number added!', {
      description: `${scannedNumber} has been added to the form`
    });
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto border-0 bg-white/80 backdrop-blur-lg shadow-2xl overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:to-white/30 before:pointer-events-none">
        <CardHeader className="space-y-1 pb-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-md rounded-t-xl border-b border-white/50 relative z-10">
          <CardTitle className="text-lg sm:text-xl text-slate-800">Vehicle Check-in</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-600">Enter vehicle details to check in</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="sm:col-span-2">
              <CameraScanner onCapture={handleCameraCapture} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className="text-sm font-medium text-slate-700">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="MH 12 AB 1234"
                  value={formData.vehicleNumber}
                  onChange={(e) => handleVehicleNumberChange(e.target.value)}
                  className="h-11 text-base bg-white/60 backdrop-blur-md border-white/40 focus:bg-white/80 focus:border-blue-300 transition-all shadow-sm hover:shadow-md"
                />
                {errors.vehicleNumber && <p className="text-red-500 text-xs sm:text-sm">{errors.vehicleNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleType" className="text-sm font-medium text-slate-700">Vehicle Type</Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                >
                  <SelectTrigger id="vehicleType" className="h-11 text-base bg-white/60 backdrop-blur-md border-white/40 hover:bg-white/80 transition-all shadow-sm hover:shadow-md">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-lg border-white/50">
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName" className="text-sm font-medium text-slate-700">Owner Name</Label>
                <Input
                  id="ownerName"
                  placeholder="Enter owner name"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="h-11 text-base bg-white/60 backdrop-blur-md border-white/40 focus:bg-white/80 focus:border-blue-300 transition-all shadow-sm hover:shadow-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="9876543210"
                  maxLength={10}
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                  className="h-11 text-base bg-white/60 backdrop-blur-md border-white/40 focus:bg-white/80 focus:border-blue-300 transition-all shadow-sm hover:shadow-md"
                />
                {errors.phoneNumber && <p className="text-red-500 text-xs sm:text-sm">{errors.phoneNumber}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full h-11 sm:h-12 text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Check In Vehicle
            </Button>
          </form>
        </CardContent>
      </Card>

      {lastCheckedInVehicle && (
        <QRCodePrint 
          vehicle={lastCheckedInVehicle}
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </>
  );
}
