import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Car, IndianRupee, TrendingUp, LogIn, LogOut } from 'lucide-react';

// Define Vehicle type
export interface Vehicle {
  _id?: string;
  vehicleNumber: string;
  vehicleType: string;
  ownerName: string;
  phoneNumber: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: number;
  charge?: number;
  status: 'active' | 'completed';
}

interface DashboardProps {
  onNavigateToRevenue: () => void;
  onNavigateToActiveVehicles: () => void;
  onNavigateToCheckInToday: () => void;
  onNavigateToCheckOutToday: () => void;
  onNavigateToTodayRevenue: () => void;
}

export function Dashboard({
  onNavigateToRevenue,
  onNavigateToActiveVehicles,
  onNavigateToCheckInToday,
  onNavigateToCheckOutToday,
  onNavigateToTodayRevenue
}: DashboardProps) {

  const [todayVehicles, setTodayVehicles] = useState<Vehicle[]>([]);
  const [activeVehicles, setActiveVehicles] = useState<Vehicle[]>([]);
  const [completedToday, setCompletedToday] = useState<Vehicle[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------
  // FETCH DASHBOARD DATA FROM SERVER
  // ------------------------------------------------------
  useEffect(() => {
    async function fetchToday() {
      const res = await fetch("https://vehicle-managment-back-end.vercel.app/api/vehicles/today");
      const data = await res.json();
      setTodayVehicles(data);
    }

    async function fetchActive() {
      const res = await fetch("https://vehicle-managment-back-end.vercel.app/api/vehicles/active");
      const data = await res.json();
      setActiveVehicles(data);
    }

    async function fetchCompletedToday() {
      const res = await fetch("https://vehicle-managment-back-end.vercel.app/api/vehicles/completed-today");
      const data = await res.json();
      setCompletedToday(data);
    }

    async function fetchTotalRevenue() {
      const res = await fetch("https://vehicle-managment-back-end.vercel.app/api/vehicles/total-revenue");
      const data = await res.json();
      setTotalRevenue(data.totalRevenue || 0);
    }

    async function loadAll() {
      setLoading(true);
      await Promise.all([
        fetchToday(),
        fetchActive(),
        fetchCompletedToday(),
        fetchTotalRevenue()
      ]);
      setLoading(false);
    }

    loadAll();
  }, []);

  // ------------------------------------------------------
  // CALCULATIONS
  // ------------------------------------------------------
  const todayRevenue = completedToday.reduce((sum, v) => sum + (v.charge || 0), 0);
  const checkedInToday = todayVehicles;

  // ------------------------------------------------------
  // DASHBOARD CARDS
  // ------------------------------------------------------
  const stats = [
    {
      title: 'Active Vehicles',
      value: activeVehicles.length,
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Check In Today',
      value: checkedInToday.length,
      icon: LogIn,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    },
    {
      title: 'Check Out Today',
      value: completedToday.length,
      icon: LogOut,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: "Today's Revenue",
      value: `₹${todayRevenue}`,
      icon: IndianRupee,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  return (
    <div className="space-y-4">
      {loading && (
        <p className="text-center text-sm text-gray-500">Loading dashboard...</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          const handleClick = () => {
            if (stat.title === 'Active Vehicles') onNavigateToActiveVehicles();
            else if (stat.title === 'Check In Today') onNavigateToCheckInToday();
            else if (stat.title === 'Check Out Today') onNavigateToCheckOutToday();
            else if (stat.title === "Today's Revenue") onNavigateToTodayRevenue();
            else if (stat.title === 'Total Revenue') onNavigateToRevenue();
          };

          return (
            <Card
              key={index}
              className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/70 backdrop-blur-md shadow-lg cursor-pointer"
              onClick={handleClick}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm text-slate-600">{stat.title}</CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>

              <CardContent>
                <div className={`text-xl sm:text-2xl ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">Click to view →</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
