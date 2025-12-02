import { useState, useEffect, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Search, X, Filter, LogIn } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

// Vehicle Interface
interface Vehicle {
  _id: string;
  vehicleNumber: string;
  vehicleType: string;
  ownerName: string;
  phoneNumber: string;
  checkInTime: string;
  status: string;
}

export function CheckInTodayDetails() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'vehicle'>('time');

  // -------------------------------
  // 🚀 Fetch Today's Check-ins API
  // -------------------------------
  useEffect(() => {
    async function fetchTodayVehicles() {
      try {
        const response = await fetch("https://vehicle-managment-back-end.vercel.app/api/vehicles/today");
        const data = await response.json();
        setVehicles(data);
      } catch (err) {
        console.error("API Error:", err);
      }
      setLoading(false);
    }

    fetchTodayVehicles();
  }, []);

  // -------------------------------
  // Apply Filters
  // -------------------------------
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

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Sort
    if (sortBy === 'vehicle') {
      filtered = [...filtered].sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));
    } else {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
      );
    }

    return filtered;
  }, [vehicles, searchQuery, vehicleTypeFilter, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setVehicleTypeFilter('all');
    setStatusFilter('all');
    setSortBy('time');
  };

  const hasActiveFilters = searchQuery || vehicleTypeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-4">

      {/* =======================
          Filters Section
      ======================== */}
      <Card className="border-0 bg-white/80 backdrop-blur-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-slate-800">Check-in Today Filters</CardTitle>
          <CardDescription>Filter and view vehicles checked in today</CardDescription>
        </CardHeader>

        <CardContent>

          {/* Filters */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Still Parked</SelectItem>
                  <SelectItem value="completed">Checked Out</SelectItem>
                </SelectContent>
              </Select>

            </div>

            {/* Sort + Clear */}
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={sortBy} onValueChange={(value: 'time' | 'vehicle') => setSortBy(value)}>
                <SelectTrigger className="w-48 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Sort by Time (Latest)</SelectItem>
                  <SelectItem value="vehicle">Sort by Vehicle Number</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* =======================
          Table 
      ======================== */}
      <Card className="border-0 bg-white shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">Today's Check-ins</CardTitle>
              <CardDescription>{filteredVehicles.length} vehicle(s)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-cyan-600" />
              <span className="text-xl font-semibold text-cyan-600">
                {filteredVehicles.length}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-center py-10">Loading...</p>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No check-ins found</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle._id}>
                        <TableCell>{vehicle.vehicleNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{vehicle.vehicleType}</Badge>
                        </TableCell>
                        <TableCell>{vehicle.ownerName}</TableCell>
                        <TableCell>{vehicle.phoneNumber}</TableCell>
                        <TableCell>
                          {new Date(vehicle.checkInTime).toLocaleString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          {vehicle.status === "active" ? (
                            <Badge className="bg-blue-100 text-blue-700">Still Parked</Badge>
                          ) : (
                            <Badge className="bg-slate-200 text-slate-700">
                              Checked Out
                            </Badge>
                          )}
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
