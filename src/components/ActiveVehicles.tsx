import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { QRScanner } from "./QRScanner";
import { QRCodePrint } from "./QRCodePrint";
import { LogOut, Clock, User, Phone, Car, Search, Printer } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { log } from "console";

// -------------------
// Vehicle Interface
// -------------------
export interface Vehicle {
  _id: string;                    // MongoDB ID
  vehicleNumber: string;
  vehicleType: string;
  ownerName: string;
  phoneNumber: string;
  checkInTime: string | Date;
  checkOutTime?: string | Date;
  duration?: number;
  charge?: number;
  status: string;
}

// -------------------
// Component Props
// -------------------
interface ActiveVehiclesProps {
  calculateCharge: (hours: number) => number;
}

// =====================================================================================
// MAIN COMPONENT
// =====================================================================================
export function ActiveVehicles({ calculateCharge }: ActiveVehiclesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // -------------------------------------------------
  // 1️⃣ FETCH ACTIVE VEHICLES FROM BACKEND
  // -------------------------------------------------
  const fetchActiveVehicles = async () => {
    // TEST
    try {
      const res = await fetch("https://vehicle-managment-back-end.vercel.app/api/vehicles/active");
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Invalid API response:", data);
        return;
      }

      // Convert checkInTime string → Date object
      const formatted = data.map((v) => ({
        ...v,
        checkInTime: new Date(v.checkInTime),
      }));

      setVehicles(formatted);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load active vehicles");
    }
  };

  // Call on component load
  useEffect(() => {
    fetchActiveVehicles();
  }, []);

  // -------------------------------------------------
  // 2️⃣ FORMAT DURATION
  // -------------------------------------------------
  const formatDuration = (checkInTime: Date): string => {
    const now = new Date();
    const diff = now.getTime() - checkInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) return `${minutes} min`;
    return `${hours}h ${minutes}m`;
  };

  // -------------------------------------------------
  // 3️⃣ GET CURRENT CHARGE
  // -------------------------------------------------
  const getCurrentCharge = (checkInTime: Date): number => {
    const now = new Date();
    const diff = now.getTime() - checkInTime.getTime();
    const hours = diff / (1000 * 60 * 60);
    return calculateCharge(hours);
  };

  // -------------------------------------------------
  // 4️⃣ CHECKOUT VEHICLE → CALL BACKEND API
  // -------------------------------------------------
  const handleCheckout = async (vehicle: Vehicle) => {
    try {
      const response = await fetch(
        `https://vehicle-managment-back-end.vercel.app/api/vehicles/${vehicle._id}/checkout`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error("Checkout failed", { description: data.message });
        return;
      }

      toast.success("Vehicle checked out!", {
        description: `${vehicle.vehicleNumber} | Charge ₹${data.vehicle.charge}`,
      });

      // Remove vehicle from active list
      setVehicles((prev) => prev.filter((v) => v._id !== vehicle._id));
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleQRScan = (vehicleNumber: string) => setSearchQuery(vehicleNumber);

  const handleQRCodePrint = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowQRCode(true);
  };

  // -------------------------------------------------
  // 5️⃣ FILTER VEHICLES
  // -------------------------------------------------
  const filteredVehicles = vehicles.filter((v) =>
    v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // =====================================================================================
  // UI RENDER
  // =====================================================================================
  if (vehicles.length === 0) {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-lg shadow-2xl">
        <CardContent className="py-10 text-center">
          <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-slate-500">No active vehicles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Scanner */}
      <Card className="border-0 bg-white/90 shadow-xl">
        <CardHeader>
          <CardTitle>Active Vehicles</CardTitle>
          <CardDescription>{vehicles.length} vehicle(s)</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by vehicle number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <QRScanner onScan={handleQRScan} />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle._id} className="shadow-lg bg-white/80">
            <CardContent className="pt-6 space-y-4">
              {/* HEADER */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{vehicle.vehicleNumber}</h3>
                  <Badge>{vehicle.vehicleType}</Badge>

                  <div className="flex items-center text-sm text-slate-600 mt-2">
                    <User className="w-4 h-4 mr-1" />
                    {vehicle.ownerName}
                  </div>

                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="w-4 h-4 mr-1" />
                    {vehicle.phoneNumber}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold">
                    ₹{getCurrentCharge(vehicle.checkInTime as Date)}
                  </div>
                  <div className="text-sm text-slate-500">Current charge</div>
                </div>
              </div>

              {/* DURATION */}
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded text-sm text-slate-700">
                <Clock className="w-4 h-4" />
                Parked for {formatDuration(vehicle.checkInTime as Date)}
              </div>

              {/* CHECK-IN TIME */}
              <div className="text-xs text-slate-500">
                Check-in: {new Date(vehicle.checkInTime).toLocaleString("en-IN")}
              </div>

              {/* ACTIONS */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" onClick={() => handleQRCodePrint(vehicle)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print QR
                </Button>

                <Button variant="destructive" onClick={() => handleCheckout(vehicle)}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showQRCode && selectedVehicle && (
        <QRCodePrint
          vehicle={selectedVehicle}
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
}
