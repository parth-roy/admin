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
import { Loader2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/platform/form-driver-leads')({
  component: FormDriverLeadsPage,
});

function FormDriverLeadsPage() {
  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['form-driver-leads'],
    queryFn: async () => {
      const { data } = await api.get('/form-driver-leads');
      return data.data;
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Form Driver Leads</h1>
        <p className="text-muted-foreground text-slate-500">
          Manage driver onboarding leads from the public website form.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>
            View and process submitted documents for driver onboarding
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50 hover:bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600">Date</TableHead>
                  <TableHead className="font-semibold text-slate-600">Name</TableHead>
                  <TableHead className="font-semibold text-slate-600">Phone</TableHead>
                  <TableHead className="font-semibold text-slate-600">City</TableHead>
                  <TableHead className="font-semibold text-slate-600">Vehicle Type</TableHead>
                  <TableHead className="font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsResponse?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  leadsResponse?.map((lead: any) => (
                    <TableRow key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-600 whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-slate-600">{lead.phone}</TableCell>
                      <TableCell className="text-slate-600">{lead.city}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {lead.vehicleType.replace(/_/g, ' ')}
                        </Badge>
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
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Link to="/platform/form-driver-leads/$id" params={{ id: lead.id }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
