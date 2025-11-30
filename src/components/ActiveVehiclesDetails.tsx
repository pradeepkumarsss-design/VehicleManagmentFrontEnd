import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Search, Filter, Car, Clock, Printer } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  vehicleType: string;
  ownerName: string;
  phoneNumber: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  duration?: number;
  charge?: number;
}

export function ActiveVehiclesDetails() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [sortBy, setSortBy] = useState<'checkin' | 'duration' | 'vehicle'>('checkin');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live duration
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active vehicles
  const fetchActiveVehicles = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/vehicles/active");
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      console.error("API Error:", err);
      toast.error("Failed to fetch active vehicles");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveVehicles();
  }, []);

  // Calculate Charge Logic
  const calculateCharge = (hours: number): number => {
    if (hours <= 12) {
      return 10;
    }
    const days = Math.ceil(hours / 24);
    return days * 20;
  };

  // Handle Checkout
  const handleCheckout = async (vehicleId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}/checkout`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Vehicle checked out successfully", {
          description: `Charge: ₹${data.vehicle.charge}`
        });
        // Refresh list
        fetchActiveVehicles();
      } else {
        toast.error("Checkout failed", { description: data.message });
      }
    } catch (err) {
      console.error("Checkout Error:", err);
      toast.error("Error during checkout");
    }
  };

  // Apply filters
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        v =>
          v.vehicleNumber.toLowerCase().includes(query) ||
          v.ownerName.toLowerCase().includes(query) ||
          v.phoneNumber.includes(query)
      );
    }

    // Vehicle type filter
    if (vehicleTypeFilter !== 'all') {
      filtered = filtered.filter(v => v.vehicleType === vehicleTypeFilter);
    }

    // Date range filter (by check-in date)
    if (dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);

      filtered = filtered.filter(v => {
        const checkInDate = new Date(v.checkInTime);
        return checkInDate >= fromDate && checkInDate <= toDate;
      });
    } else if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      filtered = filtered.filter(v => new Date(v.checkInTime) >= fromDate);
    } else if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(v => new Date(v.checkInTime) <= toDate);
    }

    // Sort
    if (sortBy === 'duration') {
      filtered = [...filtered].sort((a, b) => {
        const durationA = (currentTime.getTime() - new Date(a.checkInTime).getTime()) / (1000 * 60 * 60);
        const durationB = (currentTime.getTime() - new Date(b.checkInTime).getTime()) / (1000 * 60 * 60);
        return durationB - durationA;
      });
    } else if (sortBy === 'vehicle') {
      filtered = [...filtered].sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));
    } else {
      filtered = [...filtered].sort((a, b) =>
        new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
      );
    }

    return filtered;
  }, [vehicles, searchQuery, vehicleTypeFilter, dateRange, sortBy, currentTime]);

  const clearFilters = () => {
    setSearchQuery('');
    setVehicleTypeFilter('all');
    setDateRange({ from: '', to: '' });
    setSortBy('checkin');
  };

  const hasActiveFilters = searchQuery || vehicleTypeFilter !== 'all' || dateRange.from || dateRange.to;

  const formatDuration = (checkInTime: string): string => {
    const checkIn = new Date(checkInTime);
    const duration = (currentTime.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    const hours = Math.floor(duration);
    const minutes = Math.floor((duration - hours) * 60);
    const seconds = Math.floor(((duration - hours) * 60 - minutes) * 60);

    if (hours === 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getCurrentCharge = (checkInTime: string): number => {
    const checkIn = new Date(checkInTime);
    const duration = (currentTime.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    return calculateCharge(duration);
  };

  const generateQRCode = async (vehicle: Vehicle): Promise<string> => {
    const qrData = `Vehicle: ${vehicle.vehicleNumber}\nOwner: ${vehicle.ownerName}\nPhone: ${vehicle.phoneNumber}\nType: ${vehicle.vehicleType}\nCheck-in: ${new Date(vehicle.checkInTime).toLocaleString('en-IN')}`;

    try {
      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeUrl;
    } catch (error) {
      console.error('QR Code generation error:', error);
      return '';
    }
  };

  const handlePrintQR = async (vehicle: Vehicle) => {
    const qrCodeUrl = await generateQRCode(vehicle);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Parking Ticket - ${vehicle.vehicleNumber}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .ticket {
                text-align: center;
                border: 2px dashed #333;
                padding: 30px;
                max-width: 400px;
              }
              h1 { margin: 0 0 20px 0; font-size: 24px; }
              .info { margin: 10px 0; font-size: 16px; }
              .qr { margin: 20px 0; }
              img { max-width: 100%; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <h1>🚗 Parking Ticket</h1>
              <div class="info"><strong>Vehicle:</strong> ${vehicle.vehicleNumber}</div>
              <div class="info"><strong>Owner:</strong> ${vehicle.ownerName}</div>
              <div class="info"><strong>Phone:</strong> ${vehicle.phoneNumber}</div>
              <div class="info"><strong>Type:</strong> ${vehicle.vehicleType}</div>
              <div class="info"><strong>Check-in:</strong> ${new Date(vehicle.checkInTime).toLocaleString('en-IN')}</div>
              <div class="qr">
                <img src="${qrCodeUrl}" alt="QR Code" />
              </div>
              <p>Please keep this ticket safe</p>
            </div>
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <Card className="border-0 bg-white/80 backdrop-blur-lg shadow-2xl overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:to-white/30 before:pointer-events-none">
        <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-md rounded-t-xl border-b border-white/50 relative z-10">
          <CardTitle className="text-lg sm:text-xl text-slate-800">Active Vehicles Filters</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-600">
            Filter and manage currently parked vehicles
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 relative z-10">
          <div className="space-y-3">
            {/* Filter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search vehicle, owner, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-base"
                />
              </div>

              {/* Vehicle Type */}
              <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All Vehicle Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicle Types</SelectItem>
                  <SelectItem value="Bike">Bike</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                </SelectContent>
              </Select>

              {/* Date From */}
              <div className="relative">
                {/* <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" /> */}
                <Input
                  type="date"
                  placeholder="From Date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="pl-3 h-11 text-base"
                />
              </div>

              {/* Date To */}
              <div className="relative">
                {/* <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" /> */}
                <Input
                  type="date"
                  placeholder="To Date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="pl-3 h-11 text-base"
                />
              </div>
            </div>

            {/* Sort and Clear */}
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={sortBy} onValueChange={(value: 'checkin' | 'duration' | 'vehicle') => setSortBy(value)}>
                <SelectTrigger className="w-48 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkin">Sort by Check-in (Latest)</SelectItem>
                  <SelectItem value="duration">Sort by Duration (Longest)</SelectItem>
                  <SelectItem value="vehicle">Sort by Vehicle Number</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 gap-1.5"
                >
                  {/* <X className="w-4 h-4" /> */}
                  Clear Filters
                </Button>
              )}

              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  {[
                    searchQuery && 'Search',
                    vehicleTypeFilter !== 'all' && vehicleTypeFilter,
                    dateRange.from && 'Date Range'
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Vehicles Table */}
      <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">Active Vehicles</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {filteredVehicles.length} vehicle(s) currently parked
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              <span className="text-lg sm:text-xl text-blue-600 font-semibold">
                {filteredVehicles.length}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <p className="text-center py-10">Loading...</p>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-base">No active vehicles found</p>
              {hasActiveFilters && (
                <p className="text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100">
                      <TableHead className="whitespace-nowrap">Vehicle Number</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">Owner</TableHead>
                      <TableHead className="whitespace-nowrap">Phone</TableHead>
                      <TableHead className="whitespace-nowrap">Check-in</TableHead>
                      <TableHead className="whitespace-nowrap">Duration</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Current Charge</TableHead>
                      <TableHead className="text-center whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle._id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium">{vehicle.vehicleNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {vehicle.vehicleType}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{vehicle.ownerName}</TableCell>
                        <TableCell className="whitespace-nowrap">{vehicle.phoneNumber}</TableCell>
                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                          {new Date(vehicle.checkInTime).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-orange-500" />
                            <span className="text-orange-600 font-medium">
                              {formatDuration(vehicle.checkInTime)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-semibold whitespace-nowrap">
                          ₹{getCurrentCharge(vehicle.checkInTime)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintQR(vehicle)}
                              className="h-8 gap-1"
                            >
                              <Printer className="w-3 h-3" />
                              Print
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCheckout(vehicle._id)}
                              className="h-8 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                            >
                              Checkout
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}