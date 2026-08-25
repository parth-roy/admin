import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useGigJob } from "@/hooks/useGigJobs";

export const Route = createFileRoute("/workforce-bookings/$id")({
  component: WorkforceBookingDetailsPage,
});

function WorkforceBookingDetailsPage() {
  const { id } = Route.useParams();
  const { data: gig, isLoading } = useGigJob(id);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!gig) return <div className="p-8 text-center text-red-500">Booking not found.</div>;

  return (
    <div className="flex-1 overflow-auto bg-slate-50">
      <PageHeader 
        title={`Booking ${gig.jobNumber}`} 
        subtitle={`Created ${new Date(gig.createdAt).toLocaleString()}`} 
        action={
          <Link to="/workforce-bookings" className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to list
          </Link>
        }
      />
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Customer Details</CardTitle></CardHeader>
            <CardContent>
              <p className="font-bold">{gig.customer?.name || 'Unknown'}</p>
              <p className="text-slate-500">{gig.customer?.phone}</p>
              <p className="text-slate-500 mt-2">{gig.locationAddress}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="text-sm">Job Configuration</CardTitle></CardHeader>
            <CardContent>
              <p><strong>Category:</strong> {gig.gigCategory}</p>
              <p><strong>Status:</strong> {gig.status}</p>
              <p><strong>Urgency:</strong> {gig.urgency?.replace('_', ' ')}</p>
              {gig.scheduledSlot && <p><strong>Slot:</strong> {gig.scheduledSlot}</p>}
              <p><strong>Total Fare:</strong> ₹{gig.totalFare}</p>
            </CardContent>
          </Card>
        </div>

        {gig.tasks && gig.tasks.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Cart Items / Tasks</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                {gig.tasks.map((task: any) => (
                  <div key={task.id} className="p-4 flex justify-between items-center bg-white">
                    <div>
                      <h4 className="font-bold text-slate-900">{task.title}</h4>
                      <p className="text-xs text-slate-500">{task.category} &bull; {task.variant}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{task.price} x {task.quantity}</p>
                      <p className="text-xs font-semibold text-emerald-600">Total: ₹{(task.price * task.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              {gig.tipAmount > 0 && (
                <div className="mt-4 text-right pr-4 text-sm">
                  <strong>Tip Amount:</strong> ₹{gig.tipAmount}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
