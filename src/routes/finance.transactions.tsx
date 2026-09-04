import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/client';
import { PageHeader } from '@/components/admin/AdminTopbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Smartphone,
  Globe,
  Truck,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const Route = createFileRoute('/finance/transactions')({
  head: () => ({ meta: [{ title: 'Gateway Transactions — Parther Admin' }] }),
  component: GatewayTransactionsPage,
});

interface PaymentTxItem {
  id: string;
  platform: 'CUSTOMER_APP' | 'DRIVER_APP' | 'WORKFORCE_APP' | 'WORKFORCE_WEB' | 'VAHAN_WEB' | 'ADMIN_PANEL';
  paymentType: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  customerPhone: string | null;
  customerName: string | null;
  customerEmail: string | null;
  entityId: string | null;
  notes: any;
  createdAt: string;
  updatedAt: string;
}

const PLATFORM_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  WORKFORCE_WEB: { label: 'MetroMitra Web', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon: Globe },
  VAHAN_WEB: { label: 'GoMyTruck Web', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: Globe },
  CUSTOMER_APP: { label: 'Customer App', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', icon: Smartphone },
  DRIVER_APP: { label: 'Driver App', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: Truck },
  WORKFORCE_APP: { label: 'Workforce App', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-800', icon: Users },
  ADMIN_PANEL: { label: 'Admin Panel', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', icon: ShieldCheck },
};

function GatewayTransactionsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-payment-transactions', page, limit, platformFilter, statusFilter, search],
    queryFn: async () => {
      const res = await api.get('/payments/admin/transactions', {
        params: {
          page,
          limit,
          platform: platformFilter === 'ALL' ? undefined : platformFilter,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          search: search.trim() || undefined,
        },
      });
      return res.data?.data;
    },
  });

  const transactions: PaymentTxItem[] = data?.transactions || [];
  const metrics = data?.metrics || { totalVolume: 0, totalCount: 0, successfulCount: 0, failedCount: 0 };
  const pagination = data?.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const successRate = metrics.totalCount > 0
    ? ((metrics.successfulCount / metrics.totalCount) * 100).toFixed(1)
    : '100';

  return (
    <div>
      <PageHeader
        title="Gateway Transactions"
        description="Unified real-time payment history across GoMyTruck, MetroMitra, Customer & Driver apps."
      />

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200 shadow-2xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Transactions
              </CardDescription>
              <CardTitle className="text-2xl font-black text-slate-900">
                {metrics.totalCount.toLocaleString('en-IN')}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-emerald-50/60 border-emerald-200 shadow-2xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Total Volume Collected
              </CardDescription>
              <CardTitle className="text-2xl font-black text-emerald-700">
                ₹{Number(metrics.totalVolume || 0).toLocaleString('en-IN')}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-teal-50/60 border-teal-200 shadow-2xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Successful Payments
              </CardDescription>
              <CardTitle className="text-2xl font-black text-teal-700">
                {metrics.successfulCount.toLocaleString('en-IN')}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-blue-50/60 border-blue-200 shadow-2xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Success Rate
              </CardDescription>
              <CardTitle className="text-2xl font-black text-blue-700">
                {successRate}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search phone, name, email, or order ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          {/* Platform Filters */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Platforms' },
              { id: 'WORKFORCE_WEB', label: 'MetroMitra Web' },
              { id: 'VAHAN_WEB', label: 'GoMyTruck Web' },
              { id: 'CUSTOMER_APP', label: 'Customer App' },
              { id: 'DRIVER_APP', label: 'Driver App' },
              { id: 'WORKFORCE_APP', label: 'Workforce App' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPlatformFilter(p.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  platformFilter === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Status Filter + Refresh */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="PENDING">Pending Only</option>
              <option value="FAILED">Failed Only</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 h-9 rounded-xl text-xs font-bold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="border-slate-200 shadow-2xs rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-xs font-semibold">Loading payment transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-black text-slate-700">No payment transactions recorded</p>
                <p className="text-xs text-slate-400 mt-1">
                  Incoming payments from Razorpay will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/70 border-b border-slate-200">
                      <TableHead className="text-[11px] font-bold">Date & Time</TableHead>
                      <TableHead className="text-[11px] font-bold">Platform Source</TableHead>
                      <TableHead className="text-[11px] font-bold">Payment Type</TableHead>
                      <TableHead className="text-[11px] font-bold">Customer Details</TableHead>
                      <TableHead className="text-[11px] font-bold">Amount</TableHead>
                      <TableHead className="text-[11px] font-bold">Gateway References</TableHead>
                      <TableHead className="text-[11px] font-bold text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => {
                      const plat = PLATFORM_CONFIG[tx.platform] || {
                        label: tx.platform,
                        bg: 'bg-slate-100',
                        text: 'text-slate-800',
                        icon: Globe,
                      };
                      const PlatIcon = plat.icon;

                      return (
                        <TableRow key={tx.id} className="hover:bg-slate-50/50">
                          {/* Date */}
                          <TableCell className="text-xs font-medium text-slate-600 whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>

                          {/* Platform Source */}
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${plat.bg} ${plat.text}`}
                            >
                              <PlatIcon className="w-3 h-3" />
                              {plat.label}
                            </span>
                          </TableCell>

                          {/* Payment Type */}
                          <TableCell className="text-xs font-bold text-slate-800 whitespace-nowrap">
                            {tx.paymentType.replace(/_/g, ' ')}
                          </TableCell>

                          {/* Customer */}
                          <TableCell>
                            <div>
                              <p className="text-xs font-black text-slate-900">
                                {tx.customerName || 'Customer'}
                              </p>
                              {tx.customerPhone && (
                                <p className="text-[11px] font-semibold text-slate-600">
                                  +91 {tx.customerPhone}
                                </p>
                              )}
                              {tx.customerEmail && (
                                <p className="text-[10.5px] text-slate-400 truncate max-w-[150px]">
                                  {tx.customerEmail}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Amount */}
                          <TableCell className="font-mono font-black text-sm text-slate-900">
                            ₹{Number(tx.amount).toFixed(2)}
                          </TableCell>

                          {/* Gateway References */}
                          <TableCell className="font-mono text-xs text-slate-700">
                            {tx.razorpayPaymentId && (
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-slate-400">Pay:</span>
                                <span className="font-bold text-slate-800 select-all">
                                  {tx.razorpayPaymentId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(tx.razorpayPaymentId!, `p_${tx.id}`)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                  title="Copy Payment ID"
                                >
                                  {copiedKey === `p_${tx.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            {tx.razorpayOrderId && (
                              <div className="flex items-center gap-1 text-[10.5px] text-slate-500">
                                <span>Order:</span>
                                <span className="truncate max-w-[120px] select-all">
                                  {tx.razorpayOrderId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(tx.razorpayOrderId!, `o_${tx.id}`)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                  title="Copy Order ID"
                                >
                                  {copiedKey === `o_${tx.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-right whitespace-nowrap">
                            {tx.status === 'SUCCESS' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-black text-[11px] gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
                              </Badge>
                            ) : tx.status === 'PENDING' ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-black text-[11px] gap-1">
                                <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Pending
                              </Badge>
                            ) : tx.status === 'FAILED' ? (
                              <Badge variant="destructive" className="font-black text-[11px] gap-1">
                                <XCircle className="w-3 h-3" /> Failed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="font-black text-[11px]">
                                {tx.status}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-2 pt-2">
            <p className="text-xs text-slate-500 font-medium">
              Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="gap-1 h-8 rounded-xl text-xs font-bold cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="gap-1 h-8 rounded-xl text-xs font-bold cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
