import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Copy,
  Check,
  Phone,
  ShieldCheck,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { useState, useMemo } from 'react';

export const Route = createFileRoute('/platform/direct-contact-approvals')({
  component: DirectContactApprovalsPage,
});

interface DirectContactItem {
  id: string;
  customerPhone: string;
  utr: string;
  screenshotUrl: string | null;
  serviceCategory: string;
  city: string;
  amount: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  workerIds: string[];
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

function DirectContactApprovalsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [selectedItem, setSelectedItem] = useState<DirectContactItem | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Fetch Requests
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['direct-contact-requests', statusFilter],
    queryFn: async () => {
      const res = await api.get('/payments/admin/direct-contact-requests', {
        params: {
          limit: 100,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        },
      });
      return res.data?.data?.requests as DirectContactItem[];
    },
  });

  // Verify / Reject Mutation
  const actionMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string }) => {
      const res = await api.post('/payments/admin/verify-direct-contact-request', {
        id,
        status,
        rejectionReason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-contact-requests'] });
      setSelectedItem(null);
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const requests = data || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(
      (r) =>
        r.customerPhone.includes(q) ||
        r.utr.toLowerCase().includes(q) ||
        r.serviceCategory.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const verified = requests.filter((r) => r.status === 'VERIFIED').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED').length;
    const revenue = verified * 49;
    return { total, pending, verified, rejected, revenue };
  }, [requests]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Direct Contact Approvals
            </h1>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold">
              Metro Mitra ₹49 Hub
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review ₹49 UPI payments, inspect payment receipt screenshots, and grant worker contact unlock access.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold">Total Submissions</CardDescription>
            <CardTitle className="text-2xl font-black text-slate-900">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-amber-800">Pending Review</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-700">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-emerald-800">Verified & Unlocked</CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-700">{stats.verified}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-teal-50/50 border-teal-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold text-teal-800">Total Revenue</CardDescription>
            <CardTitle className="text-2xl font-black text-teal-700">₹{stats.revenue}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search phone, UTR, city, or trade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <p className="text-xs font-medium">Loading submissions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No payment submissions found</p>
              <p className="text-xs text-slate-400 mt-1">
                {search ? 'Try adjusting your search query.' : 'New submissions from the Direct Contact page will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70">
                    <TableHead className="text-[11px] font-bold">Date & Time</TableHead>
                    <TableHead className="text-[11px] font-bold">Customer Phone</TableHead>
                    <TableHead className="text-[11px] font-bold">Service & City</TableHead>
                    <TableHead className="text-[11px] font-bold">12-Digit UTR</TableHead>
                    <TableHead className="text-[11px] font-bold">Payment Screenshot</TableHead>
                    <TableHead className="text-[11px] font-bold">Status</TableHead>
                    <TableHead className="text-[11px] font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-xs font-medium text-slate-600 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>

                      <TableCell className="font-bold text-xs text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`tel:${item.customerPhone}`} className="hover:text-emerald-700 hover:underline">
                            +91 {item.customerPhone}
                          </a>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-medium text-slate-700">
                        <span className="font-bold text-slate-900">{item.serviceCategory}</span>
                        <span className="text-slate-400"> in </span>
                        <span className="text-slate-600">{item.city}</span>
                      </TableCell>

                      <TableCell className="text-xs font-mono font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{item.utr}</span>
                          <button
                            onClick={() => handleCopy(item.utr)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                            title="Copy UTR"
                          >
                            {copiedUtr === item.utr ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      <TableCell>
                        {item.screenshotUrl ? (
                          <div
                            onClick={() => setSelectedItem(item)}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <img
                              src={item.screenshotUrl}
                              alt="Receipt Proof"
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200 group-hover:border-amber-500 transition-all shadow-xs"
                            />
                            <span className="text-[11px] font-bold text-amber-600 group-hover:underline flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> View
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No image</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {item.status === 'VERIFIED' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[11px] gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </Badge>
                        ) : item.status === 'REJECTED' ? (
                          <Badge variant="destructive" className="font-bold text-[11px] gap-1">
                            <XCircle className="w-3 h-3" /> Rejected
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[11px] gap-1 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        {item.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={actionMutation.isPending}
                              onClick={() => actionMutation.mutate({ id: item.id, status: 'VERIFIED' })}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verify & Unlock
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionMutation.isPending}
                              onClick={() => {
                                const reason = prompt('Rejection reason (optional):');
                                if (reason !== null) {
                                  actionMutation.mutate({ id: item.id, status: 'REJECTED', rejectionReason: reason });
                                }
                              }}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs h-8 cursor-pointer"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {item.status === 'VERIFIED' ? `Approved by ${item.verifiedBy || 'admin'}` : 'Rejected'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screenshot & Verification Modal */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-base font-black">
                <span>Payment Screenshot Proof</span>
                <Badge
                  className={
                    selectedItem.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedItem.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }
                >
                  {selectedItem.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Cross-reference with your bank SMS or UPI transaction ledger.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Phone</span>
                  <span className="font-bold text-slate-900">+91 {selectedItem.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">12-Digit UTR</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                    <span>{selectedItem.utr}</span>
                    <button onClick={() => handleCopy(selectedItem.utr)} className="text-slate-400 hover:text-slate-700">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Trade & City</span>
                  <span className="font-bold text-slate-900">{selectedItem.serviceCategory} ({selectedItem.city})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Amount</span>
                  <span className="font-bold text-emerald-700">₹{selectedItem.amount || 49}</span>
                </div>
              </div>

              {/* Full Screenshot Image */}
              {selectedItem.screenshotUrl ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 max-h-[500px] flex items-center justify-center p-2">
                  <img
                    src={selectedItem.screenshotUrl}
                    alt="UPI Receipt Full"
                    className="max-h-[480px] w-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                  No screenshot uploaded
                </div>
              )}

              {/* Modal Actions */}
              {selectedItem.status === 'PENDING' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const reason = prompt('Rejection reason (optional):');
                      if (reason !== null) {
                        actionMutation.mutate({ id: selectedItem.id, status: 'REJECTED', rejectionReason: reason });
                      }
                    }}
                    disabled={actionMutation.isPending}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    Reject Submission
                  </Button>
                  <Button
                    onClick={() => actionMutation.mutate({ id: selectedItem.id, status: 'VERIFIED' })}
                    disabled={actionMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                  >
                    {actionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirm Payment & Unlock Contacts
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
