import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGigJobs } from "@/hooks/useGigJobs";

export const Route = createFileRoute("/workforce-bookings/")({
  component: WorkforceBookingsPage,
});

function WorkforceBookingsPage() {
  const { data: gigs, isLoading } = useGigJobs();

  return (
    <div className="flex-1 overflow-auto bg-slate-50 relative">
      <PageHeader title="Workforce Bookings" subtitle="Manage all service and task-based bookings" />
      <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
        <Card className="rounded-xl border-slate-200/60 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Job No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Fare</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : gigs?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">No bookings found.</TableCell></TableRow>
              ) : (
                gigs?.map((gig: any) => (
                  <TableRow key={gig.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <Link to={`/workforce-bookings/${gig.id}`} className="font-bold text-primary hover:underline">
                        {gig.jobNumber}
                      </Link>
                      <div className="text-xs text-muted-foreground">{new Date(gig.createdAt).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{gig.customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{gig.customer?.phone}</div>
                    </TableCell>
                    <TableCell className="font-medium">{gig.gigCategory}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
                        {gig.urgency?.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                        {gig.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{gig.totalFare?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
