import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Map as MapIcon, List } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GlobalLeadsMap from '@/components/GlobalLeadsMap';
import { useState } from 'react';

export const Route = createFileRoute('/platform/form-gig-onboard-leads')({
  component: FormGigOnboardLeadsPage,
});

function FormGigOnboardLeadsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['form-gig-leads'],
    queryFn: async () => {
      const { data } = await api.get('/form-gig-leads');
      return data.data;
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Form Gig Onboard Leads</h1>
          <p className="text-muted-foreground text-slate-500">
            Manage worker and gig onboarding leads from the public website form.
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

      {viewMode === 'map' ? (
        <GlobalLeadsMap leads={leadsResponse || []} type="gig" />
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle>Recent Gig Leads</CardTitle>
            <CardDescription>
              View and process submitted profiles for worker onboarding
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
                  <TableHead className="font-semibold text-slate-600">Job Type</TableHead>
                  <TableHead className="font-semibold text-slate-600">Vehicle Type</TableHead>
                  <TableHead className="font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsResponse?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  leadsResponse?.map((lead: any) => (
                    <TableRow key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-600 whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{lead.firstName || lead.name} {lead.lastName || ''}</TableCell>
                      <TableCell className="text-slate-600">{lead.phone}</TableCell>
                      <TableCell className="text-slate-600">{lead.city || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 uppercase">
                          {lead.jobType ? lead.jobType.replace(/-/g, ' ') : 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {lead.vehicleType ? lead.vehicleType.replace(/_/g, ' ') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lead.status === 'APPROVED' ? 'default' :
                            lead.status === 'REJECTED' ? 'destructive' : 'secondary'
                          }
                          className={
                            lead.status === 'APPROVED' ? 'bg-emerald-500' :
                            lead.status === 'PENDING' ? 'bg-amber-500 text-white' : ''
                          }
                        >
                          {lead.status || 'PENDING'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/platform/form-gig-onboard-leads/${lead.id}`} >
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
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
