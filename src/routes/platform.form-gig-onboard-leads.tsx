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

export const Route = createFileRoute('/platform/form-gig-onboard-leads')({
  component: FormGigOnboardLeadsPage,
});

/** Normalise jobType to display form (handles both "AC Technician" and "ac-technician") */
function normaliseJobType(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/-/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
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

function confidenceBadge(conf: string | null | undefined) {
  if (!conf) return null;
  if (conf === 'VERIFIED')
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-1.5">
        ✓ Verified
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px] px-1.5">
      ~ Probable
    </Badge>
  );
}

function FormGigOnboardLeadsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  /* ── Filter state ─────────────────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('');
  const [nearbyKm] = useState(75);

  /* ── Data fetch ───────────────────────────────────────────────────── */
  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['form-gig-leads'],
    queryFn: async () => {
      const { data } = await api.get('/form-gig-leads');
      return data.data as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const leads = leadsResponse ?? [];

  /* ── Normalise jobType on every lead for consistent grouping ──────── */
  const normLeads = useMemo(
    () =>
      leads.map((l) => ({
        ...l,
        _normJobType: normaliseJobType(l.jobType),
      })),
    [leads]
  );

  /* ── Derive unique option lists ───────────────────────────────────── */
  const uniqueStates = useMemo(
    () => [...new Set(normLeads.map((l) => l.givenState).filter(Boolean))].sort(),
    [normLeads]
  );
  const uniqueDistricts = useMemo(() => {
    const src = stateFilter
      ? normLeads.filter((l) => l.givenState === stateFilter)
      : normLeads;
    return [...new Set(src.map((l) => l.givenDistrict).filter(Boolean))].sort();
  }, [normLeads, stateFilter]);
  const uniqueCities = useMemo(() => {
    const src = districtFilter
      ? normLeads.filter((l) => l.givenDistrict === districtFilter)
      : stateFilter
      ? normLeads.filter((l) => l.givenState === stateFilter)
      : normLeads;
    return [...new Set(src.map((l) => l.city).filter(Boolean))].sort();
  }, [normLeads, stateFilter, districtFilter]);
  const uniqueJobTypes = useMemo(
    () => [...new Set(normLeads.map((l) => l._normJobType).filter(Boolean))].sort(),
    [normLeads]
  );
  const uniqueStatuses = useMemo(
    () => [...new Set(normLeads.map((l) => l.status).filter(Boolean))].sort(),
    [normLeads]
  );
  const uniqueConfidences = useMemo(
    () => [...new Set(normLeads.map((l) => l.confidence).filter(Boolean))].sort(),
    [normLeads]
  );

  /* ── Apply dropdown filters ───────────────────────────────────────── */
  const dropdownFiltered = useMemo(
    () =>
      normLeads.filter((l) => {
        if (stateFilter && l.givenState !== stateFilter) return false;
        if (districtFilter && l.givenDistrict !== districtFilter) return false;
        if (cityFilter && l.city !== cityFilter) return false;
        if (jobTypeFilter && l._normJobType !== jobTypeFilter) return false;
        if (statusFilter && l.status !== statusFilter) return false;
        if (confidenceFilter && l.confidence !== confidenceFilter) return false;
        return true;
      }),
    [normLeads, stateFilter, districtFilter, cityFilter, jobTypeFilter, statusFilter, confidenceFilter]
  );

  /* ── Table search also filters by name/location text ─────────────── */
  const tableFiltered = useMemo(() => {
    if (!searchTerm.trim()) return dropdownFiltered;
    const q = searchTerm.toLowerCase();
    return dropdownFiltered.filter((l) =>
      [l.firstName, l.lastName, l.city, l.area, l.givenDistrict, l.givenState]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [dropdownFiltered, searchTerm]);

  const hasFilters =
    searchTerm ||
    stateFilter ||
    districtFilter ||
    cityFilter ||
    jobTypeFilter ||
    statusFilter ||
    confidenceFilter;

  const clearAll = useCallback(() => {
    setSearchTerm('');
    setStateFilter('');
    setDistrictFilter('');
    setCityFilter('');
    setJobTypeFilter('');
    setStatusFilter('');
    setConfidenceFilter('');
  }, []);

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
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Form Gig Onboard Leads
          </h1>
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
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

          <SearchCombobox
            options={uniqueStates}
            value={stateFilter}
            onChange={handleStateChange}
            placeholder="All States"
            searchPlaceholder="Search state…"
            className="w-full"
          />

          <SearchCombobox
            options={uniqueDistricts}
            value={districtFilter}
            onChange={handleDistrictChange}
            placeholder="All Districts"
            searchPlaceholder="Search district…"
            className="w-full"
          />

          <SearchCombobox
            options={uniqueCities}
            value={cityFilter}
            onChange={(v) => setCityFilter(v)}
            placeholder="All Cities"
            searchPlaceholder="Search city…"
            className="w-full"
          />

          <SearchCombobox
            options={uniqueJobTypes}
            value={jobTypeFilter}
            onChange={setJobTypeFilter}
            placeholder="All Services"
            searchPlaceholder="Search service…"
            className="w-full"
          />

          <SearchCombobox
            options={uniqueStatuses}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            searchPlaceholder="Search status…"
            className="w-full"
          />
        </div>

        {/* Confidence filter + active filter chips */}
        <div className="flex gap-2 flex-wrap items-center">
          <SearchCombobox
            options={uniqueConfidences}
            value={confidenceFilter}
            onChange={setConfidenceFilter}
            placeholder="Any Confidence"
            searchPlaceholder="Search…"
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
              {jobTypeFilter && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-slate-100"
                  onClick={() => setJobTypeFilter('')}
                >
                  {jobTypeFilter} <X className="w-2.5 h-2.5 ml-1" />
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
              {confidenceFilter && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-slate-100"
                  onClick={() => setConfidenceFilter('')}
                >
                  {confidenceFilter} <X className="w-2.5 h-2.5 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>

        {searchTerm && viewMode === 'map' && (
          <p className="text-xs text-slate-400 mt-1">
            💡 Map will highlight matching workers and show nearby workers within{' '}
            <span className="font-medium text-slate-600">{nearbyKm} km</span> as amber pins.
          </p>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {viewMode === 'map' ? (
        <GlobalLeadsMap
          leads={dropdownFiltered}
          searchTerm={searchTerm}
          nearbyRadiusKm={nearbyKm}
          type="gig"
        />
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle>Gig Onboard Leads</CardTitle>
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
                      <TableHead className="font-semibold text-slate-600">Service</TableHead>
                      <TableHead className="font-semibold text-slate-600">City</TableHead>
                      <TableHead className="font-semibold text-slate-600">District</TableHead>
                      <TableHead className="font-semibold text-slate-600">Experience</TableHead>
                      <TableHead className="font-semibold text-slate-600">Confidence</TableHead>
                      <TableHead className="font-semibold text-slate-600">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableFiltered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-10 text-slate-500">
                          No leads match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableFiltered.map((lead: any) => (
                        <TableRow key={lead.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-600 whitespace-nowrap text-xs">
                            {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {lead.firstName || lead.name} {lead.lastName || ''}
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">{lead.phone}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-violet-50 text-violet-700 border-violet-200"
                            >
                              {lead._normJobType || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">{lead.city || 'N/A'}</TableCell>
                          <TableCell className="text-slate-500 text-xs">
                            {lead.givenDistrict || '—'}
                          </TableCell>
                          <TableCell className="text-slate-600 text-xs">
                            {lead.experience || '—'}
                          </TableCell>
                          <TableCell>{confidenceBadge(lead.confidence)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={statusVariant(lead.status)}
                              className={statusClass(lead.status)}
                            >
                              {lead.status || 'PENDING'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/platform/form-gig-onboard-leads/${lead.id}`}>
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
