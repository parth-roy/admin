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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GlobalLeadsMap from '@/components/GlobalLeadsMap';
import { SearchCombobox } from '@/components/SearchCombobox';
import { useState, useMemo, useCallback } from 'react';

export const Route = createFileRoute('/platform/form-driver-leads')({
  component: FormDriverLeadsPage,
});

/* ─── normalise vehicle type for display ─────────────────────────────────── */
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

function FormDriverLeadsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  /* ── Filter state ────────────────────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nearbyKm] = useState(75);

  /* ── Data fetch ──────────────────────────────────────────────────────── */
  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['form-driver-leads'],
    queryFn: async () => {
      const { data } = await api.get('/form-driver-leads');
      return data.data as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const leads = leadsResponse ?? [];

  /* ── Derive unique option lists ──────────────────────────────────────── */
  const uniqueStates = useMemo(
    () => [...new Set(leads.map((l) => l.givenState || l.state).filter(Boolean))].sort(),
    [leads]
  );
  const uniqueDistricts = useMemo(() => {
    const src = stateFilter
      ? leads.filter((l) => (l.givenState || l.state) === stateFilter)
      : leads;
    return [...new Set(src.map((l) => l.givenDistrict).filter(Boolean))].sort();
  }, [leads, stateFilter]);
  const uniqueCities = useMemo(() => {
    const src = districtFilter
      ? leads.filter((l) => l.givenDistrict === districtFilter)
      : stateFilter
      ? leads.filter((l) => (l.givenState || l.state) === stateFilter)
      : leads;
    return [...new Set(src.map((l) => l.city).filter(Boolean))].sort();
  }, [leads, stateFilter, districtFilter]);
  const uniqueVehicles = useMemo(
    () => [...new Set(leads.map((l) => l.vehicleType).filter(Boolean))].sort(),
    [leads]
  );
  const uniqueStatuses = useMemo(
    () => [...new Set(leads.map((l) => l.status).filter(Boolean))].sort(),
    [leads]
  );

  /* ── Apply dropdown filters (NOT search — search is proximity-aware) ─── */
  const dropdownFiltered = useMemo(() => {
    return leads.filter((l) => {
      if (stateFilter && (l.givenState || l.state) !== stateFilter) return false;
      if (districtFilter && l.givenDistrict !== districtFilter) return false;
      if (cityFilter && l.city !== cityFilter) return false;
      if (vehicleFilter && l.vehicleType !== vehicleFilter) return false;
      if (statusFilter && l.status !== statusFilter) return false;
      return true;
    });
  }, [leads, stateFilter, districtFilter, cityFilter, vehicleFilter, statusFilter]);

  /* ── Table also respects the name/location text search ──────────────── */
  const tableFiltered = useMemo(() => {
    if (!searchTerm.trim()) return dropdownFiltered;
    const q = searchTerm.toLowerCase();
    return dropdownFiltered.filter((l) =>
      [l.name, l.city, l.givenDistrict, l.givenState, l.state]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [dropdownFiltered, searchTerm]);

  const hasFilters =
    searchTerm || stateFilter || districtFilter || cityFilter || vehicleFilter || statusFilter;

  const clearAll = useCallback(() => {
    setSearchTerm('');
    setStateFilter('');
    setDistrictFilter('');
    setCityFilter('');
    setVehicleFilter('');
    setStatusFilter('');
  }, []);

  /* ── When state changes, reset dependent dropdowns ─────────────────── */
  const handleStateChange = (v: string) => {
    setStateFilter(v);
    setDistrictFilter('');
    setCityFilter('');
  };
  const handleDistrictChange = (v: string) => {
    setDistrictFilter(v);
    setCityFilter('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Form Driver Leads</h1>
          <p className="text-muted-foreground text-slate-500 mt-0.5">
            {isLoading ? 'Loading…' : `${leads.length} total · ${tableFiltered.length} shown`}
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

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
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
          {/* Name / Location smart search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search name or location…"
              className="pl-9 h-9 text-sm border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* State */}
          <SearchCombobox
            options={uniqueStates}
            value={stateFilter}
            onChange={handleStateChange}
            placeholder="All States"
            searchPlaceholder="Search state…"
            className="w-full"
          />

          {/* District */}
          <SearchCombobox
            options={uniqueDistricts}
            value={districtFilter}
            onChange={handleDistrictChange}
            placeholder="All Districts"
            searchPlaceholder="Search district…"
            className="w-full"
          />

          {/* City */}
          <SearchCombobox
            options={uniqueCities}
            value={cityFilter}
            onChange={(v) => setCityFilter(v)}
            placeholder="All Cities"
            searchPlaceholder="Search city…"
            className="w-full"
          />

          {/* Vehicle Type */}
          <SearchCombobox
            options={uniqueVehicles.map(fmtVehicle)}
            value={vehicleFilter ? fmtVehicle(vehicleFilter) : ''}
            onChange={(v) => {
              // Map back to original enum
              const orig = uniqueVehicles.find((u) => fmtVehicle(u) === v) ?? v;
              setVehicleFilter(orig);
            }}
            placeholder="All Vehicles"
            searchPlaceholder="Search vehicle…"
            className="w-full"
          />
        </div>

        {/* Second row: Status */}
        <div className="flex gap-2 flex-wrap items-center">
          <SearchCombobox
            options={uniqueStatuses}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            searchPlaceholder="Search status…"
            className="w-40"
          />
          {hasFilters && (
            <div className="flex flex-wrap gap-1 ml-2">
              {stateFilter && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-slate-100"
                  onClick={() => handleStateChange('')}
                >
                  {stateFilter} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
              {districtFilter && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-slate-100"
                  onClick={() => handleDistrictChange('')}
                >
                  {districtFilter} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
              {cityFilter && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-slate-100"
                  onClick={() => setCityFilter('')}
                >
                  {cityFilter} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
              {vehicleFilter && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-slate-100"
                  onClick={() => setVehicleFilter('')}
                >
                  {fmtVehicle(vehicleFilter)} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
              {statusFilter && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-slate-100"
                  onClick={() => setStatusFilter('')}
                >
                  {statusFilter} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Proximity hint when typing in search */}
        {searchTerm && viewMode === 'map' && (
          <p className="text-xs text-slate-400 mt-1">
            💡 Map will highlight matching drivers and show nearby drivers within{' '}
            <span className="font-medium text-slate-600">{nearbyKm} km</span> as amber pins.
          </p>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {viewMode === 'map' ? (
        <GlobalLeadsMap
          leads={dropdownFiltered}
          searchTerm={searchTerm}
          nearbyRadiusKm={nearbyKm}
          type="driver"
        />
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle>Driver Leads</CardTitle>
            <CardDescription>
              {tableFiltered.length} of {leads.length} leads shown
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              </div>
            ) : (
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
                      <TableHead className="text-right font-semibold text-slate-600">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableFiltered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                          No leads match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableFiltered.map((lead: any) => (
                        <TableRow key={lead.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-600 whitespace-nowrap">
                            {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell className="text-slate-600">{lead.phone}</TableCell>
                          <TableCell className="text-slate-600">{lead.city || 'N/A'}</TableCell>
                          <TableCell className="text-slate-500 text-xs">
                            {lead.givenDistrict || '—'}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {lead.givenState || lead.state || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {fmtVehicle(lead.vehicleType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusVariant(lead.status)}
                              className={statusClass(lead.status)}
                            >
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              to="/platform/form-driver-leads/$id"
                              params={{ id: lead.id }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
