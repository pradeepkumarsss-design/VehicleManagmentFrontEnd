import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Search, X, Filter, LogOut } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

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

export function CheckOutTodayDetails() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'charge' | 'duration'>('time');

  // Fetch vehicles checked out today
  useEffect(() => {
    async function fetchCompletedToday() {
      try {
        const response = await fetch("https://vehicle-managment-back-end.vercel.app/api/vehicles/completed-today");
        const data = await response.json();
        setVehicles(data);
      } catch (err) {
        console.error("API Error:", err);
      }
      setLoading(false);
    }

    fetchCompletedToday();
  }, []);

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

    // Sort
    if (sortBy === 'charge') {
      filtered = [...filtered].sort((a, b) => (b.charge || 0) - (a.charge || 0));
    } else if (sortBy === 'duration') {
      filtered = [...filtered].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    } else {
      filtered = [...filtered].sort((a, b) => {
        if (!a.checkOutTime || !b.checkOutTime) return 0;
        return new Date(b.checkOutTime).getTime() - new Date(a.checkOutTime).getTime();
      });
    }

    return filtered;
  }, [vehicles, searchQuery, vehicleTypeFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setVehicleTypeFilter('all');
    setSortBy('time');
  };

  const hasActiveFilters = searchQuery || vehicleTypeFilter !== 'all';

  const formatDuration = (duration: number): string => {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    
    if (hours === 0) {
      return `${minutes} min`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <Card className="border-0 bg-white/80 backdrop-blur-lg shadow-2xl overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:to-white/30 before:pointer-events-none">
        <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-orange-50/80 to-red-50/80 backdrop-blur-md rounded-t-xl border-b border-white/50 relative z-10">
          <CardTitle className="text-lg sm:text-xl text-slate-800">Check-out Today Filters</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-600">
            Filter and view vehicles checked out today
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 relative z-10">
          <div className="space-y-3">
            {/* Filter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: 'time' | 'charge' | 'duration') => setSortBy(value)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Sort by Time (Latest)</SelectItem>
                  <SelectItem value="charge">Sort by Charge (Highest)</SelectItem>
                  <SelectItem value="duration">Sort by Duration (Longest)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear */}
            <div className="flex flex-wrap gap-2 items-center">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}

              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  {[
                    searchQuery && 'Search',
                    vehicleTypeFilter !== 'all' && vehicleTypeFilter
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-out Records Table */}
      <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">Today's Check-outs</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {filteredVehicles.length} vehicle(s) checked out today
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-orange-600" />
              <span className="text-lg sm:text-xl text-orange-600 font-semibold">
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
              <p className="text-base">No check-outs found for today</p>
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
                      <TableHead className="whitespace-nowrap">Check-out Time</TableHead>
                      <TableHead className="whitespace-nowrap">Duration</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Charge</TableHead>
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
                          {vehicle.checkOutTime ? new Date(vehicle.checkOutTime).toLocaleString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDuration(vehicle.duration || 0)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold whitespace-nowrap">
                          ₹{vehicle.charge}
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
