import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, FileImage, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/workforce/verification")({
  component: WorkforceVerificationPage,
});

function WorkforceVerificationPage() {
  const queryClient = useQueryClient();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pendingWorkerDocuments"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/worker-documents/pending");
      return res.data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.post(`/admin/worker-documents/${verifyingId}/verify`, payload);
    },
    onSuccess: () => {
      toast.success("Documents verified successfully.");
      queryClient.invalidateQueries({ queryKey: ["pendingWorkerDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["pendingWorkerDocumentsCount"] });
      setVerifyingId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to verify documents");
    },
  });

  const workers = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="flex-1 overflow-auto bg-slate-50">
      <PageHeader title="Workforce Document Verification" description="Verify uploaded documents manually." />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg border">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">All Caught Up!</h3>
            <p className="text-muted-foreground">No pending documents to verify.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {workers.map((worker: any) => (
              <Card key={worker.id} className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold">{worker.user?.name || "Unknown"}</h3>
                    <p className="text-muted-foreground">{worker.user?.phone || "No phone"}</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Pending Verification
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  {(worker.documents || []).map((doc: any) => (
                    <div key={doc.id} className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">{doc.type}</span>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="block relative group rounded-md overflow-hidden border">
                        <div className="aspect-square bg-slate-100 flex items-center justify-center">
                          <img src={doc.fileUrl} alt={doc.type} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <FileImage className="text-white h-6 w-6" />
                        </div>
                      </a>
                    </div>
                  ))}
                </div>

                {verifyingId === worker.id ? (
                  <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                    <h4 className="font-medium">Enter Details from Documents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold mb-1 block">Aadhaar Number (12 digits)</label>
                        <Input value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value)} placeholder="000000000000" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block">PAN Number</label>
                        <Input value={panNumber} onChange={e => setPanNumber(e.target.value)} placeholder="ABCDE1234F" className="uppercase" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                      <Button variant="outline" onClick={() => setVerifyingId(null)}>Cancel</Button>
                      <Button 
                        disabled={verifyMutation.isPending || aadhaarNumber.length !== 12 || panNumber.length !== 10}
                        onClick={() => verifyMutation.mutate({ approve: true, aadhaarNumber, panNumber: panNumber.toUpperCase() })}
                      >
                        {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Approve & Verify
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-end border-t pt-4">
                    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason) verifyMutation.mutate({ approve: false, rejectReason: reason });
                    }}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Documents
                    </Button>
                    <Button onClick={() => {
                      setVerifyingId(worker.id);
                      setAadhaarNumber("");
                      setPanNumber("");
                    }}>
                      Verify Worker
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
