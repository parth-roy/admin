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
import { useState, useCallback, useDeferredValue, useMemo } from 'react';

export const Route = createFileRoute('/platform/form-gig-onboard-leads')({
  component: FormGigOnboardLeadsPage,
});

/* ─── helpers ─────────────────────────────────────────────────── */
function normaliseJobType(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/-/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
function statusVariant(status: string) {
  if (status === 'APPROVED' || status === 'CONVERTED' || status === 'SUITABLE') return 'default';
  if (status === 'REJECTED') return 'destructive';
  return 'secondary';
}
function statusClass(status: string) {
  if (status === 'SUITABLE') return 'bg-blue-500 text-white';
  if (status === 'APPROVED' || status === 'CONVERTED') return 'bg-emerald-500';
  if (status === 'PENDING') return 'bg-amber-500 text-white';
  return '';
}

const JOB_TYPES = [
  'electrician','plumber','carpenter','painter','cleaning','ac-repair',
  'appliance-repair','security','loading-unloading','general-helper',
  'furniture-moving','packer','last-mile-delivery',
];
const STATUSES = ['PENDING', 'SUITABLE', 'APPROVED', 'CONVERTED', 'REJECTED'];
const LIMIT = 100;

function FormGigOnboardLeadsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  /* ── Filter + pagination state ───────────────────────────────── */
  const [searchInput, setSearchInput] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const searchTerm = useDeferredValue(searchInput);

  /* ── Filter options query (distinct states, districts, cities) ── */
  const { data: filterOptions } = useQuery({
    queryKey: ['form-gig-leads-filter-options'],
    queryFn: async () => {
      const { data: res } = await api.get('/form-gig-leads/filter-options');
      return res.data as {
        states: string[];
        districts: { state: string; district: string }[];
        cities: { state: string; district: string; city: string }[];
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const uniqueStates = useMemo(() => filterOptions?.states ?? [], [filterOptions]);

  const uniqueDistricts = useMemo(() => {
    if (!filterOptions?.districts) return [];
    const filtered = stateFilter
      ? filterOptions.districts.filter((d) => d.state.toLowerCase() === stateFilter.toLowerCase())
      : filterOptions.districts;
    return [...new Set(filtered.map((d) => d.district).filter(Boolean))].sort();
  }, [filterOptions, stateFilter]);

  const uniqueCities = useMemo(() => {
    if (!filterOptions?.cities) return [];
    let filtered = filterOptions.cities;
    if (stateFilter) {
      filtered = filtered.filter((c) => c.state.toLowerCase() === stateFilter.toLowerCase());
    }
    if (districtFilter) {
      filtered = filtered.filter((c) => c.district.toLowerCase() === districtFilter.toLowerCase());
    }
    return [...new Set(filtered.map((c) => c.city).filter(Boolean))].sort();
  }, [filterOptions, stateFilter, districtFilter]);

  /* ── Server-paginated query ──────────────────────────────────── */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['form-gig-leads', page, searchTerm, stateFilter, districtFilter, cityFilter, jobTypeFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(LIMIT),
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (stateFilter) params.state = stateFilter;
      if (districtFilter) params.district = districtFilter;
      if (cityFilter) params.city = cityFilter;
      if (jobTypeFilter) params.jobType = jobTypeFilter;
      if (statusFilter) params.status = statusFilter;

      const { data: res } = await api.get('/form-gig-leads', { params });
      return res as { data: any[]; total: number; page: number; totalPages: number; limit: number };
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const leads = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const hasFilters = searchInput || stateFilter || districtFilter || cityFilter || jobTypeFilter || statusFilter;

  const applyFilter = useCallback((fn: () => void) => { fn(); setPage(1); }, []);
  const clearAll = useCallback(() => {
    setSearchInput(''); setStateFilter(''); setDistrictFilter('');
    setCityFilter(''); setJobTypeFilter(''); setStatusFilter(''); setPage(1);
  }, []);

  const handleStateChange = (v: string) => applyFilter(() => { setStateFilter(v); setDistrictFilter(''); setCityFilter(''); });
  const handleDistrictChange = (v: string) => applyFilter(() => { setDistrictFilter(v); setCityFilter(''); });
  const handleCityChange = (v: string) => applyFilter(() => setCityFilter(v));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Form Gig Onboard Leads</h1>
          <p className="text-muted-foreground text-slate-500 mt-0.5">
            {isLoading ? 'Loading…' : (
              <>
                <span className="font-medium text-slate-700">{total.toLocaleString()}</span> total leads
                {isFetching && !isLoading && <span className="ml-2 text-xs text-slate-400">Updating…</span>}
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
            <Button variant="ghost" size="sm" onClick={clearAll} className="ml-auto text-xs text-slate-500 hover:text-slate-800 h-7 px-2">
              <X className="w-3 h-3 mr-1" /> Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search name, phone, city, job…"
              className="pl-9 h-9 text-sm border-slate-200"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            />
          </div>

          {/* State SearchCombobox */}
          <SearchCombobox
            options={uniqueStates}
            value={stateFilter}
            onChange={handleStateChange}
            placeholder="All States"
            searchPlaceholder="Search state…"
            className="w-full"
          />

          {/* District SearchCombobox */}
          <SearchCombobox
            options={uniqueDistricts}
            value={districtFilter}
            onChange={handleDistrictChange}
            placeholder="All Districts"
            searchPlaceholder="Search district…"
            emptyText={stateFilter ? "No districts in selected state." : "Select a state or search..."}
            className="w-full"
          />

          {/* City SearchCombobox */}
          <SearchCombobox
            options={uniqueCities}
            value={cityFilter}
            onChange={handleCityChange}
            placeholder="All Cities"
            searchPlaceholder="Search city…"
            emptyText={districtFilter || stateFilter ? "No cities in selected filter." : "Search city name..."}
            className="w-full"
          />

          {/* Job Type */}
          <SearchCombobox
            options={JOB_TYPES.map(normaliseJobType)}
            value={jobTypeFilter ? normaliseJobType(jobTypeFilter) : ''}
            onChange={(v) => {
              const orig = JOB_TYPES.find((j) => normaliseJobType(j) === v) ?? v;
              applyFilter(() => setJobTypeFilter(orig));
            }}
            placeholder="All Job Types"
            searchPlaceholder="Search job…"
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
              {stateFilter && <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100" onClick={() => handleStateChange('')}>{stateFilter} <X className="w-2.5 h-2.5 ml-1" /></Badge>}
              {districtFilter && <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100" onClick={() => { setDistrictFilter(''); setPage(1); }}>{districtFilter} <X className="w-2.5 h-2.5 ml-1" /></Badge>}
              {cityFilter && <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100" onClick={() => { setCityFilter(''); setPage(1); }}>{cityFilter} <X className="w-2.5 h-2.5 ml-1" /></Badge>}
              {jobTypeFilter && <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100" onClick={() => applyFilter(() => setJobTypeFilter(''))}>{normaliseJobType(jobTypeFilter)} <X className="w-2.5 h-2.5 ml-1" /></Badge>}
              {statusFilter && <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100" onClick={() => applyFilter(() => setStatusFilter(''))}>{statusFilter} <X className="w-2.5 h-2.5 ml-1" /></Badge>}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {viewMode === 'map' ? (
        <ClusteredLeadsMap
          type="gig"
          searchTerm={searchTerm}
          state={stateFilter}
          district={districtFilter}
          city={cityFilter}
          jobType={jobTypeFilter || undefined}
          status={statusFilter || undefined}
        />
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle>Gig Onboard Leads</CardTitle>
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
                        <TableHead className="font-semibold text-slate-600">Job Type</TableHead>
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
                            <TableCell className="font-medium">
                              {lead.firstName} {lead.lastName}
                            </TableCell>
                            <TableCell className="text-slate-600">{lead.phone}</TableCell>
                            <TableCell className="text-slate-600">{lead.city || 'N/A'}</TableCell>
                            <TableCell className="text-slate-500 text-xs">{lead.givenDistrict || '—'}</TableCell>
                            <TableCell className="text-slate-600">{lead.givenState || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                                {normaliseJobType(lead.jobType)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(lead.status)} className={statusClass(lead.status)}>
                                {lead.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Link to="/platform/form-gig-onboard-leads/$id" params={{ id: lead.id }}>
                                <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50">
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
                        variant="outline" size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isFetching}
                        className="h-8 px-3"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
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
                        variant="outline" size="sm"
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
