import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Truck,
  MapPin,
  Calendar,
  Phone,
  Package,
  BadgeIndianRupee,
  Eye,
  Edit2,
  Trash2,
  X,
  Building,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useManualBookings, useDeleteManualBooking } from "@/hooks/useManualBookings";
import { manualBookingsApi, type ManualBookingRecord } from "@/lib/api/manual-bookings.api";
import { ManualBookingFormModal } from "@/components/admin/ManualBookingFormModal";
import { ManualBookingDetailDrawer } from "@/components/admin/ManualBookingDetailDrawer";
import { MatchedDriversModal } from "@/components/admin/MatchedDriversModal";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/manual-bookings/")({
  head: () => ({ meta: [{ title: "Manual / Offline Bookings — Parther Admin" }] }),
  component: ManualBookingsPage,
});

const VEHICLE_TYPES = [
  { value: "ALL", label: "All Vehicles" },
  { value: "TATA_ACE", label: "Tata Ace" },
  { value: "BOLERO_PICKUP", label: "Bolero Pickup" },
  { value: "MINI_TRUCK", label: "Mini Truck" },
  { value: "TRUCK_14FT", label: "14ft Eicher" },
  { value: "TRUCK_17FT", label: "17ft Eicher" },
  { value: "TRUCK_19FT", label: "19ft ICV" },
  { value: "TRUCK_20FT", label: "20ft Truck" },
  { value: "CONTAINER_32FT", label: "32ft Container" },
  { value: "TRAILER_40FT", label: "40ft Trailer" },
  { value: "OPEN_BODY_TRUCK", label: "Open Body" },
];

const STATUS_FILTERS = [
  { value: "ALL", label: "All Statuses" },
  { value: "INQUIRY", label: "Inquiry" },
  { value: "QUOTED", label: "Quoted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "TRUCK_ASSIGNED", label: "Truck Assigned" },
  { value: "LOADING", label: "Loading" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "UNLOADED", label: "Unloaded" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_FILTERS = [
  { value: "ALL", label: "All Payment Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIAL", label: "Partial Advance" },
  { value: "PAID", label: "Fully Paid" },
  { value: "CREDIT", label: "Credit" },
  { value: "CANCELLED", label: "Cancelled" },
];

const SOURCE_FILTERS = [
  { value: "ALL", label: "All Sources" },
  { value: "PHONE_CALL", label: "Phone Call" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "BROKER", label: "Broker / Agent" },
  { value: "TRANSPORTER_EXTERNAL", label: "External Transporter" },
  { value: "ADMIN_MANUAL", label: "Admin Manual" },
];

function fmtVehicle(v?: string | null) {
  if (!v) return "—";
  return v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function ManualBookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [vehicleType, setVehicleType] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [pickupCity, setPickupCity] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");

  const debouncedSearch = useDebounce(search, 400);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<ManualBookingRecord | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ManualBookingRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [matchedDriversBooking, setMatchedDriversBooking] = useState<ManualBookingRecord | null>(null);

  const deleteMut = useDeleteManualBooking();

  const queryParams = useMemo(() => ({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status !== "ALL" ? status : undefined,
    vehicleType: vehicleType !== "ALL" ? vehicleType : undefined,
    paymentStatus: paymentStatus !== "ALL" ? paymentStatus : undefined,
    source: source !== "ALL" ? source : undefined,
    pickupCity: pickupCity.trim() || undefined,
    dropoffCity: dropoffCity.trim() || undefined,
  }), [page, debouncedSearch, status, vehicleType, paymentStatus, source, pickupCity, dropoffCity]);

  const { data, isLoading, isFetching } = useManualBookings(queryParams);

  const hasActiveFilters =
    search || status !== "ALL" || vehicleType !== "ALL" || paymentStatus !== "ALL" || source !== "ALL" || pickupCity || dropoffCity;

  const handleResetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setVehicleType("ALL");
    setPaymentStatus("ALL");
    setSource("ALL");
    setPickupCity("");
    setDropoffCity("");
    setPage(1);
  };

  const handleExportCsv = () => {
    const url = manualBookingsApi.exportCsvUrl(queryParams);
    window.open(url, "_blank");
  };

  const handleOpenCreate = () => {
    setEditingBooking(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: ManualBookingRecord) => {
    setEditingBooking(record);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (record: ManualBookingRecord) => {
    setSelectedBooking(record);
    setIsDetailOpen(true);
  };

  const handleOpenMatchedDrivers = (record: ManualBookingRecord) => {
    setMatchedDriversBooking(record);
  };

  const handleDelete = async (record: ManualBookingRecord) => {
    if (!window.confirm(`Delete manual booking ${record.bookingNumber}?`)) return;
    await deleteMut.mutateAsync(record.id);
  };

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Manual & Offline Bookings"
        description="Record, manage, and dispatch manual phone inquiries, broker loads, and custom bookings."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Operations", href: "/bookings" },
          { label: "Manual Bookings" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs font-semibold"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
            >
              <Plus className="h-4 w-4" />
              New Manual Booking
            </Button>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border shadow-xs space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-primary" /> Total Offline Loads
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats?.totalBookings ?? "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">All recorded manual loads</div>
        </Card>

        <Card className="p-4 bg-card border shadow-xs space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <BadgeIndianRupee className="h-3.5 w-3.5 text-emerald-600" /> Total Quoted Revenue
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{stats?.totalQuotedRevenue ? stats.totalQuotedRevenue.toLocaleString("en-IN") : "0"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Advance: ₹{stats?.totalAdvanceReceived ? stats.totalAdvanceReceived.toLocaleString("en-IN") : "0"}
          </div>
        </Card>

        <Card className="p-4 bg-card border shadow-xs space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-sky-600" /> In Transit / Active
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
            {stats?.inTransitCount ?? "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">Dispatched or on road</div>
        </Card>

        <Card className="p-4 bg-card border shadow-xs space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-indigo-600" /> Confirmed Bookings
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {stats?.confirmedCount ?? "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">Ready for truck allocation</div>
        </Card>
      </div>

      {/* Robust Filtration Bar */}
      <Card className="p-4 border shadow-xs space-y-3 bg-card/60 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Filter className="h-3.5 w-3.5 text-primary" /> Filter & Search Loads
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
          {/* Search Input */}
          <div className="relative xl:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search customer, phone, route, booking #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Type Filter */}
          <div>
            <Select
              value={vehicleType}
              onValueChange={(v) => {
                setVehicleType(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <Select
              value={paymentStatus}
              onValueChange={(v) => {
                setPaymentStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div>
            <Select
              value={source}
              onValueChange={(v) => {
                setSource(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCE_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pickup City Search */}
          <div>
            <Input
              placeholder="Pickup City..."
              value={pickupCity}
              onChange={(e) => {
                setPickupCity(e.target.value);
                setPage(1);
              }}
              className="h-8 text-xs bg-background"
            />
          </div>
        </div>
      </Card>

      {/* Main Table Grid */}
      <Card className="border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold text-foreground">Booking Ref</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Customer & Shipper</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Route & Date</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Vehicle & Driver</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Goods</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Commercials</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((record) => (
                  <TableRow
                    key={record.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetail(record)}
                  >
                    {/* Booking Number */}
                    <TableCell className="font-mono text-xs font-bold text-primary whitespace-nowrap">
                      {record.bookingNumber}
                      <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                        {record.source || "ADMIN_MANUAL"} • {new Date(record.createdAt).toLocaleDateString("en-IN")}
                      </div>
                    </TableCell>

                    {/* Customer Info */}
                    <TableCell className="text-xs">
                      <div className="font-semibold text-foreground">{record.customerName || "—"}</div>
                      {record.customerPhone && (
                        <div className="text-muted-foreground font-mono text-[11px] flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" /> {record.customerPhone}
                        </div>
                      )}
                      {record.customerCompany && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                          {record.customerCompany}
                        </div>
                      )}
                    </TableCell>

                    {/* Route */}
                    <TableCell className="text-xs">
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        <span>{record.pickupCity || "Pickup"}</span>
                        <span className="text-muted-foreground font-normal">➔</span>
                        <span>{record.dropoffCity || "Dropoff"}</span>
                      </div>
                      {record.pickupDateTime && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> {new Date(record.pickupDateTime).toLocaleDateString("en-IN")}
                        </div>
                      )}
                    </TableCell>

                    {/* Vehicle & Driver */}
                    <TableCell className="text-xs">
                      <div className="font-semibold text-foreground">
                        {fmtVehicle(record.vehicleType)}
                        {record.vehicleNumber && (
                          <span className="ml-1 font-mono uppercase text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold">
                            {record.vehicleNumber}
                          </span>
                        )}
                      </div>
                      {record.driverName && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Driver: {record.driverName}
                        </div>
                      )}
                    </TableCell>

                    {/* Goods */}
                    <TableCell className="text-xs">
                      <div className="font-medium text-foreground">{record.goodsType || "General Cargo"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {record.goodsWeightTons ? `${record.goodsWeightTons} Tons` : record.goodsWeightKg ? `${record.goodsWeightKg} Kg` : "Weight not set"}
                      </div>
                    </TableCell>

                    {/* Commercials */}
                    <TableCell className="text-xs">
                      <div className="font-bold text-foreground">
                        ₹{record.quotedAmount?.toLocaleString("en-IN") || "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Adv: ₹{record.advanceReceived || 0} • Bal: ₹{record.balanceAmount || 0}
                      </div>
                    </TableCell>

                    {/* Status Badges */}
                    <TableCell className="text-xs">
                      <div className="flex flex-col gap-1 items-start">
                        {(() => {
                          switch (record.status) {
                            case "CONFIRMED":
                              return <Badge className="bg-emerald-500 text-white text-[10px]">Confirmed</Badge>;
                            case "IN_TRANSIT":
                              return <Badge className="bg-sky-500 text-white text-[10px]">In Transit</Badge>;
                            case "TRUCK_ASSIGNED":
                              return <Badge className="bg-indigo-500 text-white text-[10px]">Assigned</Badge>;
                            case "LOADING":
                              return <Badge className="bg-amber-500 text-white text-[10px]">Loading</Badge>;
                            case "DELIVERED":
                              return <Badge className="bg-teal-600 text-white text-[10px]">Delivered</Badge>;
                            case "COMPLETED":
                              return <Badge className="bg-green-600 text-white text-[10px]">Completed</Badge>;
                            case "CANCELLED":
                              return <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>;
                            case "QUOTED":
                              return <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-[10px]">Quoted</Badge>;
                            default:
                              return <Badge variant="outline" className="text-muted-foreground text-[10px]">Inquiry</Badge>;
                          }
                        })()}
                        {(() => {
                          switch (record.paymentStatus) {
                            case "PAID":
                              return <Badge className="bg-emerald-600 text-white text-[9px] py-0">Paid</Badge>;
                            case "PARTIAL":
                              return <Badge className="bg-amber-500 text-white text-[9px] py-0">Partial</Badge>;
                            case "CREDIT":
                              return <Badge className="bg-blue-600 text-white text-[9px] py-0">Credit</Badge>;
                            default:
                              return <Badge variant="outline" className="text-amber-600 border-amber-300 text-[9px] py-0">Pending</Badge>;
                          }
                        })()}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 flex items-center gap-1 shadow-2xs mr-0.5 transition-all cursor-pointer"
                          title="Find Live Matched Drivers for this Load"
                          onClick={() => handleOpenMatchedDrivers(record)}
                        >
                          <Truck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Matched</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="View Details"
                          onClick={() => handleOpenDetail(record)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          title="Edit Booking"
                          onClick={() => handleOpenEdit(record)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Delete Booking"
                          onClick={() => handleDelete(record)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Truck className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-semibold">No manual bookings found</p>
                      <p className="text-xs text-muted-foreground">
                        {hasActiveFilters ? "Try adjusting your filters or search terms." : "Click 'New Manual Booking' above to add your first offline booking."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs">
            <div className="text-muted-foreground">
              Showing {(data.page - 1) * data.limit + 1} to{" "}
              {Math.min(data.page * data.limit, data.total)} of {data.total} records
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs gap-1"
              >
                <ChevronLeft className="h-3 w-3" /> Previous
              </Button>
              <div className="text-xs font-semibold px-2">
                Page {data.page} of {data.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs gap-1"
              >
                Next <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Form Modal (Create / Edit) */}
      <ManualBookingFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        booking={editingBooking}
      />

      {/* Detail Drawer */}
      <ManualBookingDetailDrawer
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        booking={selectedBooking}
        onEdit={(booking) => {
          setEditingBooking(booking);
          setIsFormOpen(true);
        }}
      />

      {/* Live Matched Drivers Modal */}
      <MatchedDriversModal
        open={!!matchedDriversBooking}
        onOpenChange={(open) => !open && setMatchedDriversBooking(null)}
        booking={matchedDriversBooking}
      />
    </div>
  );
}
