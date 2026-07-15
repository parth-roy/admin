import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api/client";

export const Route = createFileRoute("/platform/gigs")({
  component: GigJobsPage,
});

function GigJobsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["gigJobs"],
    queryFn: async () => {
      const res = await apiClient.get(`/gigs`);
      return res.data;
    },
  });

  const gigs = data?.data || [];
  const filteredGigs = gigs.filter(
    (gig: any) =>
      gig.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.gigType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.locationAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Gig Workforce Jobs" 
        description="View and manage standalone gig workforce jobs posted by customers."
      />

      <Card className="p-4 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by job number, type or location..."
              className="pl-9 bg-slate-50 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Job Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Workers</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading gig jobs...
                  </TableCell>
                </TableRow>
              ) : filteredGigs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No gig jobs found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGigs.map((gig: any) => (
                  <TableRow key={gig.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-slate-900">
                      {gig.jobNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-slate-600 bg-slate-50">
                        {gig.gigType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">
                      {gig.locationAddress}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {gig.workersNeeded}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      ₹{gig.totalFare?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(gig.status)}>
                        {gig.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
