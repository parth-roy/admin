import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Eye,
  Map as MapIcon,
  List,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ClusteredLeadsMap from '@/components/ClusteredLeadsMap';
import { SearchCombobox } from '@/components/SearchCombobox';
import { useState, useCallback, useDeferredValue } from 'react';

export const Route = createFileRoute('/platform/form-driver-leads')({
  component: FormDriverLeadsPage,
});

/* ─── helpers ─────────────────────────────────────────────────── */
function fmtVehicle(v: string) {
  return v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function statusVariant(status: string) {
  if (status === 'APPROVED' || status === 'CONVERTED') return 'default';
  if (status === 'REJECTED') return 'destructive';
  return 'secondary';
}
function statusClass(status: string) {
  if (status === 'APPROVED' || status === 'CONVERTED') return 'bg-emerald-500';
  if (status === 'SUITABLE') return 'bg-blue-500 text-white';
  if (status === 'PENDING') return 'bg-amber-500 text-white';
  return '';
}

const VEHICLE_TYPES = [
  'MINI_TRUCK', 'PICKUP', 'TATA_ACE', 'THREE_WHEELER', 'AUTO', 'TWO_WHEELER',
  'TRUCK_10FT', 'TRUCK_14FT', 'TRUCK_17FT', 'TRUCK_20FT',
  'CONTAINER_20FT', 'CONTAINER_32FT', 'TRAILER', 'TANKER', 'TIPPER',
];
const STATUSES = ['PENDING', 'SUITABLE', 'APPROVED', 'CONVERTED', 'REJECTED'];
const LIMIT = 100;

function FormDriverLeadsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  /* ── Filter + pagination state ───────────────────────────────── */
  const [searchInput, setSearchInput] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Defer search so typing doesn't block UI
  const searchTerm = useDeferredValue(searchInput);

  /* ── Server-paginated query ──────────────────────────────────── */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['form-driver-leads', page, searchTerm, stateFilter, districtFilter, cityFilter, vehicleFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(LIMIT),
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (stateFilter) params.state = stateFilter;
      if (districtFilter) params.district = districtFilter;
      if (cityFilter) params.city = cityFilter;
      if (vehicleFilter) params.vehicleType = vehicleFilter;
      if (statusFilter) params.status = statusFilter;

      const { data: res } = await api.get('/form-driver-leads', { params });
      return res as { data: any[]; total: number; page: number; totalPages: number; limit: number };
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev, // keep previous while fetching
  });

  const leads = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const hasFilters = searchInput || stateFilter || districtFilter || cityFilter || vehicleFilter || statusFilter;

  /* ── Reset to page 1 whenever any filter changes ─────────────── */
  const applyFilter = useCallback((fn: () => void) => { fn(); setPage(1); }, []);

  const clearAll = useCallback(() => {
    setSearchInput('');
    setStateFilter('');
    setDistrictFilter('');
    setCityFilter('');
    setVehicleFilter('');
    setStatusFilter('');
    setPage(1);
  }, []);

  const handleStateChange = (v: string) => applyFilter(() => { setStateFilter(v); setDistrictFilter(''); setCityFilter(''); });
  const handleDistrictChange = (v: string) => applyFilter(() => { setDistrictFilter(v); setCityFilter(''); });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Form Driver Leads</h1>
          <p className="text-muted-foreground text-slate-500 mt-0.5">
            {isLoading ? 'Loading…' : (
              <>
                <span className="font-medium text-slate-700">{total.toLocaleString()}</span> total leads
                {isFetching && !isLoading && (
                  <span className="ml-2 text-xs text-slate-400">Updating…</span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'shadow-sm' : ''}
          >
            <List className="w-4 h-4 mr-2" /> Table
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
            className={viewMode === 'map' ? 'shadow-sm' : ''}
          >
            <MapIcon className="w-4 h-4 mr-2" /> Map View
          </Button>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filters & Search</span>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="ml-auto text-xs text-slate-500 hover:text-slate-800 h-7 px-2"
            >
              <X className="w-3 h-3 mr-1" /> Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search name, phone, city…"
              className="pl-9 h-9 text-sm border-slate-200"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            />
          </div>

          {/* State */}
          <SearchCombobox
            options={['West Bengal','Maharashtra','Karnataka','Tamil Nadu','Uttar Pradesh','Delhi','Gujarat','Rajasthan','Andhra Pradesh','Telangana','Kerala','Madhya Pradesh','Bihar','Punjab','Haryana','Jharkhand','Odisha','Assam','Uttarakhand','Chhattisgarh','Himachal Pradesh','Goa','Tripura','Meghalaya','Manipur','Nagaland','Arunachal Pradesh','Mizoram','Sikkim','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh'].sort()}
            value={stateFilter}
            onChange={handleStateChange}
            placeholder="All States"
            searchPlaceholder="Search state…"
            className="w-full"
          />

          {/* District — freeform input since it's dynamic */}
          <Input
            placeholder="District…"
            className="h-9 text-sm border-slate-200"
            value={districtFilter}
            onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
          />

          {/* City */}
          <Input
            placeholder="City…"
            className="h-9 text-sm border-slate-200"
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          />

          {/* Vehicle Type */}
          <SearchCombobox
            options={VEHICLE_TYPES.map(fmtVehicle)}
            value={vehicleFilter ? fmtVehicle(vehicleFilter) : ''}
            onChange={(v) => {
              const orig = VEHICLE_TYPES.find((u) => fmtVehicle(u) === v) ?? v;
              applyFilter(() => setVehicleFilter(orig));
            }}
            placeholder="All Vehicles"
            searchPlaceholder="Search vehicle…"
            className="w-full"
          />
        </div>

        {/* Status row */}
        <div className="flex gap-2 flex-wrap items-center">
          <SearchCombobox
            options={STATUSES}
            value={statusFilter}
            onChange={(v) => applyFilter(() => setStatusFilter(v))}
            placeholder="All Statuses"
            searchPlaceholder="Search status…"
            className="w-40"
          />
          {hasFilters && (
            <div className="flex flex-wrap gap-1 ml-2">
              {stateFilter && (
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100" onClick={() => handleStateChange('')}>
                  {stateFilter} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
              {districtFilter && (
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100" onClick={() => { setDistrictFilter(''); setPage(1); }}>
                  {districtFilter} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
              {cityFilter && (
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100" onClick={() => { setCityFilter(''); setPage(1); }}>
                  {cityFilter} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
              {vehicleFilter && (
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100" onClick={() => applyFilter(() => setVehicleFilter(''))}>
                  {fmtVehicle(vehicleFilter)} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
              {statusFilter && (
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100" onClick={() => applyFilter(() => setStatusFilter(''))}>
                  {statusFilter} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {viewMode === 'map' ? (
        <ClusteredLeadsMap
          type="driver"
          vehicleType={vehicleFilter || undefined}
          status={statusFilter || undefined}
        />
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle>Driver Leads</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading…' : `Showing ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total.toLocaleString()} leads`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader className="bg-slate-50 hover:bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-600">Date</TableHead>
                        <TableHead className="font-semibold text-slate-600">Name</TableHead>
                        <TableHead className="font-semibold text-slate-600">Phone</TableHead>
                        <TableHead className="font-semibold text-slate-600">City</TableHead>
                        <TableHead className="font-semibold text-slate-600">District</TableHead>
                        <TableHead className="font-semibold text-slate-600">State</TableHead>
                        <TableHead className="font-semibold text-slate-600">Vehicle</TableHead>
                        <TableHead className="font-semibold text-slate-600">Status</TableHead>
                        <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                            No leads match the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        leads.map((lead: any) => (
                          <TableRow key={lead.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-medium text-slate-600 whitespace-nowrap">
                              {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell className="font-medium">{lead.name}</TableCell>
                            <TableCell className="text-slate-600">{lead.phone}</TableCell>
                            <TableCell className="text-slate-600">{lead.city || 'N/A'}</TableCell>
                            <TableCell className="text-slate-500 text-xs">{lead.givenDistrict || '—'}</TableCell>
                            <TableCell className="text-slate-600">{lead.givenState || lead.state || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {fmtVehicle(lead.vehicleType)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(lead.status)} className={statusClass(lead.status)}>
                                {lead.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Link to="/platform/form-driver-leads/$id" params={{ id: lead.id }}>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                  <Eye className="w-4 h-4 mr-2" /> View
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* ── Pagination Bar ─────────────────────────────────── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                    <p className="text-sm text-slate-500">
                      Page <span className="font-medium text-slate-700">{page}</span> of{' '}
                      <span className="font-medium text-slate-700">{totalPages}</span>
                      {' '}·{' '}
                      <span className="font-medium text-slate-700">{total.toLocaleString()}</span> total
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isFetching}
                        className="h-8 px-3"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {/* Page number pills */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let p: number;
                        if (totalPages <= 5) p = i + 1;
                        else if (page <= 3) p = i + 1;
                        else if (page >= totalPages - 2) p = totalPages - 4 + i;
                        else p = page - 2 + i;
                        return (
                          <Button
                            key={p}
                            variant={p === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(p)}
                            disabled={isFetching}
                            className="h-8 w-8 p-0"
                          >
                            {p}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isFetching}
                        className="h-8 px-3"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
