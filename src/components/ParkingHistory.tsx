import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";

import { FileText, Search, Filter, X, ArrowUpDown } from "lucide-react";

// ---------------------------
// VEHICLE TYPE
// ---------------------------
export interface Vehicle {
  _id: string;
  vehicleNumber: string;
  vehicleType: string;
  ownerName: string;
  phoneNumber: string;
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number;
  charge?: number;
  status: string;
}

// =============================================================
// MAIN COMPONENT
// =============================================================
export function ParkingHistory() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "charge" | "duration">("date");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ------------------------------------------------------------
  // FETCH ALL VEHICLES FROM BACKEND
  // ------------------------------------------------------------
  const fetchVehicles = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/vehicles");
      const data = await res.json();

      if (!Array.isArray(data)) return;

      // Convert date strings into Date objects
      const formatted = data.map((v) => ({
        ...v,
        checkInTime: new Date(v.checkInTime),
        checkOutTime: v.checkOutTime ? new Date(v.checkOutTime) : undefined,
      }));

      setVehicles(formatted);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // ------------------------------------------------------------
  // FORMAT DURATION
  // ------------------------------------------------------------
  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // ------------------------------------------------------------
  // UNIQUE VEHICLE TYPES
  // ------------------------------------------------------------
  const vehicleTypes = useMemo(() => {
    const types = new Set(vehicles.map((v) => v.vehicleType));
    return Array.from(types);
  }, [vehicles]);

  // ------------------------------------------------------------
  // FILTER + SORT
  // ------------------------------------------------------------
  const filteredAndSortedVehicles = useMemo(() => {
    let list = [...vehicles];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.vehicleNumber.toLowerCase().includes(q) ||
          v.ownerName.toLowerCase().includes(q) ||
          v.phoneNumber.toLowerCase().includes(q)
      );
    }

    // Vehicle type filter
    if (vehicleTypeFilter !== "all") {
      list = list.filter((v) => v.vehicleType === vehicleTypeFilter);
    }

    // Date From
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      list = list.filter((v) => {
        const out = v.checkOutTime || new Date();
        return out >= from;
      });
    }

    // Date To
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((v) => {
        const out = v.checkOutTime || new Date();
        return out <= to;
      });
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case "charge":
          return (b.charge || 0) - (a.charge || 0);
        case "duration":
          return (b.duration || 0) - (a.duration || 0);
        default:
        case "date":
          const tA = a.checkOutTime ? a.checkOutTime.getTime() : 0;
          const tB = b.checkOutTime ? b.checkOutTime.getTime() : 0;
          return tB - tA;
      }
    });

    return list;
  }, [vehicles, searchQuery, vehicleTypeFilter, sortBy, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery("");
    setVehicleTypeFilter("all");
    setSortBy("date");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters =
    searchQuery || vehicleTypeFilter !== "all" || dateFrom || dateTo || sortBy !== "date";

  // =============================================================
  // UI RENDER
  // =============================================================
  if (vehicles.length === 0) {
    return (
      <Card className="border-0 bg-white/80 shadow-2xl">
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No parking history yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 shadow-2xl">
      <CardHeader>
        <CardTitle>Parking History</CardTitle>
        <CardDescription>
          {filteredAndSortedVehicles.length} of {vehicles.length} records
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search vehicle / owner / phone"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {vehicleTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger>
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="charge">Sort by Charge</SelectItem>
              <SelectItem value="duration">Sort by Duration</SelectItem>
            </SelectContent>
          </Select>

          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="mb-4">
            <X className="w-4 h-4 mr-1" /> Clear Filters
          </Button>
        )}

        {/* Table */}
        {filteredAndSortedVehicles.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <Filter className="w-10 h-10 mx-auto opacity-40 mb-3" />
            No records match your filters
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Charge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedVehicles.map((v) => (
                  <TableRow key={v._id}>
                    <TableCell>{v.vehicleNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{v.vehicleType}</Badge>
                    </TableCell>
                    <TableCell>{v.ownerName}</TableCell>
                    <TableCell>{v.phoneNumber}</TableCell>

                    <TableCell>
                      {v.checkInTime.toLocaleString("en-IN")}
                    </TableCell>

                    <TableCell>
                      {v.checkOutTime?.toLocaleString("en-IN") ?? "-"}
                    </TableCell>

                    <TableCell>{formatDuration(v.duration || 0)}</TableCell>

                    <TableCell className="text-right font-bold text-green-600">
                      ₹{v.charge}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
