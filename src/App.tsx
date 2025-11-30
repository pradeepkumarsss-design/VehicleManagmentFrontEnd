import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { VehicleCheckin } from './components/VehicleCheckin';
import { ActiveVehicles } from './components/ActiveVehicles';
import { ParkingHistory } from './components/ParkingHistory';
import { RevenueDetails } from './components/RevenueDetails';
import { ActiveVehiclesDetails } from './components/ActiveVehiclesDetails';
import { CheckInTodayDetails } from './components/CheckInTodayDetails';
import { CheckOutTodayDetails } from './components/CheckOutTodayDetails';
import { TodayRevenueDetails } from './components/TodayRevenueDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { Car } from 'lucide-react';

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  ownerName: string;
  phoneNumber: string;
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number; // in hours
  charge?: number;
  status: 'active' | 'completed';
}

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleCheckin = (vehicle: Omit<Vehicle, 'id' | 'checkInTime' | 'status'>): boolean => {
    // Check if vehicle is already active (not checked out)
    const existingActiveVehicle = vehicles.find(
      v => v.vehicleNumber === vehicle.vehicleNumber && v.status === 'active'
    );

    if (existingActiveVehicle) {
      alert(`⚠️ Vehicle Already Checked In!\n\n${vehicle.vehicleNumber} is already parked and has not checked out yet.\n\nPlease check out the vehicle first before checking in again.`);
      toast.error('Vehicle Already Parked', {
        description: `${vehicle.vehicleNumber} is already parked. Please check out first.`
      });
      return false;
    }

    const newVehicle: Vehicle = {
      ...vehicle,
      id: Date.now().toString(),
      checkInTime: new Date(),
      status: 'active'
    };
    setVehicles([...vehicles, newVehicle]);
    return true;
  };

  const calculateCharge = (hours: number): number => {
    // If duration is <= 12 hours, charge is ₹10
    if (hours <= 12) {
      return 10;
    }

    // For more than 12 hours, calculate full days
    const days = Math.ceil(hours / 24);
    return days * 20;
  };

  const handleCheckout = (vehicleId: string) => {
    setVehicles(vehicles.map(vehicle => {
      if (vehicle.id === vehicleId && vehicle.status === 'active') {
        const checkOutTime = new Date();
        const duration = (checkOutTime.getTime() - vehicle.checkInTime.getTime()) / (1000 * 60 * 60); // in hours
        const charge = calculateCharge(duration);

        return {
          ...vehicle,
          checkOutTime,
          duration,
          charge,
          status: 'completed' as const
        };
      }
      return vehicle;
    }));
  };

  const activeVehicles = vehicles.filter(v => v.status === 'active');
  const completedVehicles = vehicles.filter(v => v.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20 md:pb-8">
      <Toaster position="top-center" />
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-1.5 sm:p-2 rounded-lg shadow-md">
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-slate-900 text-base sm:text-lg">Vehicle Parking Management</h1>
              <p className="text-slate-500 text-xs sm:text-sm hidden sm:block">Track and manage parking operations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1.5 bg-white shadow-lg rounded-xl border border-slate-200">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm py-2.5 sm:py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="checkin" className="text-xs sm:text-sm py-2.5 sm:py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
              Check-in
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm py-2.5 sm:py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
              Active
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm py-2.5 sm:py-3 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4 sm:mt-6">
            <Dashboard
              onNavigateToRevenue={() => setActiveTab('revenue')}
              onNavigateToActiveVehicles={() => setActiveTab('active-details')}
              onNavigateToCheckInToday={() => setActiveTab('checkin-today')}
              onNavigateToCheckOutToday={() => setActiveTab('checkout-today')}
              onNavigateToTodayRevenue={() => setActiveTab('today-revenue')}
            />
          </TabsContent>

          <TabsContent value="checkin" className="mt-4 sm:mt-6">
            <VehicleCheckin onCheckin={handleCheckin} />
          </TabsContent>

          <TabsContent value="active" className="mt-4 sm:mt-6">
            <ActiveVehicles
              calculateCharge={calculateCharge}
            />
          </TabsContent>

          <TabsContent value="active-details" className="mt-4 sm:mt-6">
            <ActiveVehiclesDetails />
          </TabsContent>

          <TabsContent value="checkin-today" className="mt-4 sm:mt-6">
            <CheckInTodayDetails />
          </TabsContent>

          <TabsContent value="checkout-today" className="mt-4 sm:mt-6">
            <CheckOutTodayDetails />
          </TabsContent>

          <TabsContent value="today-revenue" className="mt-4 sm:mt-6">
            <TodayRevenueDetails />
          </TabsContent>

          <TabsContent value="revenue" className="mt-4 sm:mt-6">
            <RevenueDetails />
          </TabsContent>

          <TabsContent value="history" className="mt-4 sm:mt-6">
            <ParkingHistory vehicles={completedVehicles} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
