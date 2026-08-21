import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle, XCircle, FileImage, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import LeadLocationMap from '@/components/LeadLocationMap';

export const Route = createFileRoute('/platform/form-gig-onboard-leads_/$id')({
  component: FormGigLeadDetailPage,
});

function FormGigLeadDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['form-gig-leads', id],
    queryFn: async () => {
      const { data } = await api.get(`/form-gig-leads/${id}`);
      return data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      await api.patch(`/form-gig-leads/${id}`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-gig-leads'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error updating status');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!lead) return <div>Lead not found.</div>;

  const DocumentLink = ({ title, url }: { title: string, url: string | null }) => {
    if (!url) return (
      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs uppercase font-bold tracking-wider">Not Provided</span>
      </div>
    );
    
    return (
      <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-emerald-200 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileImage className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-slate-700">{title}</span>
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700 p-2">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/platform/form-gig-onboard-leads">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {lead.firstName} {lead.lastName}
          </h1>
          <p className="text-slate-500">Gig Lead ID: {lead.id}</p>
        </div>
        <div className="ml-auto">
          <Badge
            variant={lead.status === 'APPROVED' ? 'default' : lead.status === 'REJECTED' ? 'destructive' : 'secondary'}
            className={`text-sm ${lead.status === 'APPROVED' ? 'bg-emerald-500' : lead.status === 'PENDING' ? 'bg-amber-500 text-white' : ''}`}
          >
            {lead.status || 'PENDING'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">Worker Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Email</p>
                  <p className="font-medium text-slate-900">{lead.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Phone Number</p>
                  <p className="font-medium text-slate-900">{lead.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Job Type</p>
                  <p className="font-medium text-slate-900 capitalize">{lead.jobType ? lead.jobType.replace(/-/g, ' ') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Vehicle Details</p>
                  <p className="font-medium text-slate-900 capitalize">{lead.vehicleType ? lead.vehicleType.replace(/_/g, ' ') : 'None'} - {lead.vehicleMake || 'N/A'}</p>
                </div>
                
                <div className="col-span-2">
                  <Separator className="my-2" />
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-1">Aadhaar Number</p>
                  <p className="font-medium text-slate-900">{lead.aadharNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">PAN Number</p>
                  <p className="font-medium text-slate-900">{lead.panNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Driving License</p>
                  <p className="font-medium text-slate-900">{lead.dlNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">RC Number</p>
                  <p className="font-medium text-slate-900">{lead.rcNumber || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <LeadLocationMap lead={lead} />
        </div>

        {/* Right Column: Documents & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">Action Center</CardTitle>
              <CardDescription>Review documents and approve or reject this lead.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={lead.status === 'APPROVED' || updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate({ status: 'APPROVED' })}
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Approve Lead
              </Button>
              <Button 
                className="w-full" 
                variant="destructive"
                disabled={lead.status === 'REJECTED' || updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate({ status: 'REJECTED' })}
              >
                <XCircle className="w-4 h-4 mr-2" /> Reject Lead
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <DocumentLink title="Profile Photo" url={lead.profilePhotoUrl} />
              <DocumentLink title="Aadhaar Front" url={lead.aadharFrontUrl} />
              <DocumentLink title="Aadhaar Back" url={lead.aadharBackUrl} />
              <DocumentLink title="PAN Front" url={lead.panFrontUrl} />
              <DocumentLink title="Driving License" url={lead.dlFrontUrl} />
              <DocumentLink title="RC Book" url={lead.rcBookUrl} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
