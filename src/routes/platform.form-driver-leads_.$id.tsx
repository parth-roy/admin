import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle, XCircle, FileImage, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import LeadLocationMap from '@/components/LeadLocationMap';

export const Route = createFileRoute('/platform/form-driver-leads_/$id')({
  component: FormDriverLeadDetailPage,
});

function FormDriverLeadDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['form-driver-leads', id],
    queryFn: async () => {
      const { data } = await api.get(`/form-driver-leads/${id}`);
      return data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      await api.patch(`/form-driver-leads/${id}`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-driver-leads'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error updating status');
    },
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/drivers/convert-lead/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-driver-leads'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Lead approved and converted to verified driver account successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error converting lead to driver');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Lead not found</h2>
        <Link to="/platform/form-driver-leads">
          <Button variant="outline">Back to Leads</Button>
        </Link>
      </div>
    );
  }

  const DocumentLink = ({ label, url }: { label: string; url: string | null }) => {
    if (!url) return null;
    return (
      <div className="flex items-center justify-between p-3 border rounded-md bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded text-blue-600">
            <FileImage className="w-5 h-5" />
          </div>
          <span className="font-medium text-slate-700">{label}</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View
          </a>
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/platform/form-driver-leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Lead Details</h1>
          <p className="text-slate-500">Review documents and approve or reject this lead.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle>Driver Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Full Name</p>
                  <p className="font-medium text-slate-900">{lead.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status</p>
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
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Phone</p>
                  <p className="font-medium text-slate-900">{lead.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Alternate Phone</p>
                  <p className="font-medium text-slate-900">{lead.alternatePhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">City</p>
                  <p className="font-medium text-slate-900">{lead.city}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Email</p>
                  <p className="font-medium text-slate-900">{lead.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">State</p>
                  <p className="font-medium text-slate-900">{lead.state || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Transport Hub</p>
                  <p className="font-medium text-slate-900">{lead.transportHub || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Submitted On</p>
                  <p className="font-medium text-slate-900">{new Date(lead.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <Separator className="my-6" />

              <h3 className="font-semibold text-lg text-slate-800 mb-4">Vehicle Details</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Vehicle Type</p>
                  <p className="font-medium text-slate-900">{lead.vehicleType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Vehicle Number</p>
                  <p className="font-medium text-slate-900">{lead.vehicleNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Aadhaar Number</p>
                  <p className="font-medium text-slate-900">{lead.aadharNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Driving License</p>
                  <p className="font-medium text-slate-900">{lead.dlNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle>Documents</CardTitle>
              <CardDescription>Review the uploaded documents below</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <DocumentLink label="Profile Photo" url={lead.profilePhotoUrl} />
                <DocumentLink label="Aadhaar Front" url={lead.aadharFrontUrl} />
                <DocumentLink label="Aadhaar Back" url={lead.aadharBackUrl} />
                <DocumentLink label="DL Front" url={lead.dlFrontUrl} />
                <DocumentLink label="DL Back" url={lead.dlBackUrl} />
                <DocumentLink label="RC Book" url={lead.rcBookUrl} />
                <DocumentLink label="Insurance" url={lead.insuranceUrl} />
                
                {!lead.profilePhotoUrl && !lead.aadharFrontUrl && (
                  <p className="text-slate-500 italic">No documents uploaded.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {lead.status !== 'CONVERTED' ? (
                <>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                    disabled={convertMutation.isPending || updateStatusMutation.isPending}
                    onClick={() => convertMutation.mutate()}
                  >
                    {convertMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                    )}
                    Approve &amp; Convert to Driver
                  </Button>
                  {lead.status === 'PENDING' && (
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      disabled={convertMutation.isPending || updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate({ status: 'REJECTED' })}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Lead
                    </Button>
                  )}
                </>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-sm text-emerald-800 space-y-2">
                  <CheckCircle className="w-6 h-6 mx-auto text-emerald-600" />
                  <p className="font-bold">Active &amp; Verified Driver</p>
                  <p className="text-xs text-emerald-700">
                    This lead was successfully converted into an active Driver User with full dispatch access.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <LeadLocationMap lead={lead} />
        </div>
      </div>
    </div>
  );
}
