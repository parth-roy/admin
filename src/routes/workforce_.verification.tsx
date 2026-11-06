import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle, XCircle, FileImage, Loader2, Sparkles, Globe,
  Phone, MapPin, Eye, ZoomIn, ZoomOut, RotateCw, AlertTriangle,
  User, Check, Copy, Search, Clock, Briefcase,
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/workforce_/verification")({
  component: WorkforceVerificationPage,
});

const REJECTION_PRESETS = [
  "Blurry or unreadable photo / text",
  "Document expired / validity lapsed",
  "Name does not match application details",
  "Wrong document uploaded for this slot",
  "Corners cut off / partial document shown",
  "Tampered or edited image detected",
];

type TabType = "all" | "website" | "app";

interface LightboxState {
  fileUrl: string;
  docType: string;
  workerName: string;
}

function WorkforceVerificationPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");

  // Rejection Dialog state
  const [rejectDialog, setRejectDialog] = useState<{
    workerId: string;
    workerName: string;
    isWebsiteLead?: boolean;
    leadId?: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Lightbox Modal state for full image inspection
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["pendingWorkerDocuments"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/worker-documents/pending");
      return res.data;
    },
  });

  // Verify / Reject App Worker mutation
  const verifyMutation = useMutation({
    mutationFn: async ({
      workerId,
      ...payload
    }: {
      workerId: string;
      approve: boolean;
      aadhaarNumber?: string;
      panNumber?: string;
      rejectReason?: string;
    }) => {
      await apiClient.post(`/admin/worker-documents/${workerId}/verify`, payload);
    },
    onSuccess: (_, variables) => {
      if (variables.approve) {
        toast.success("Worker documents approved & verified successfully!");
      } else {
        toast.info("Worker documents marked as rejected.");
      }
      queryClient.invalidateQueries({ queryKey: ["pendingWorkerDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["pendingWorkerDocumentsCount"] });
      setVerifyingId(null);
      setRejectDialog(null);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update documents");
    },
  });

  // Convert Website Gig Lead mutation
  const convertLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      await apiClient.post(`/admin/worker-documents/convert-lead/${leadId}`);
    },
    onSuccess: () => {
      toast.success("Gig worker approved & converted! Profile is now fully verified with live job access.");
      queryClient.invalidateQueries({ queryKey: ["pendingWorkerDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["pendingWorkerDocumentsCount"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to convert website lead to worker");
    },
  });

  // Reject Website Gig Lead mutation
  const rejectLeadMutation = useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: string; reason?: string }) => {
      await apiClient.post(`/admin/worker-documents/reject-lead/${leadId}`, { reason });
    },
    onSuccess: () => {
      toast.info("Website gig lead marked as rejected.");
      queryClient.invalidateQueries({ queryKey: ["pendingWorkerDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["pendingWorkerDocumentsCount"] });
      setRejectDialog(null);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to reject website lead");
    },
  });

  const allWorkers: any[] = Array.isArray(data?.data) ? data.data : [];

  // Filter out any already verified workers defensive check
  const pendingWorkers = allWorkers.filter((w: any) => !w.isDocVerified);

  // Tab counts
  const websiteCount = pendingWorkers.filter((w: any) => w.source === "WEBSITE").length;
  const appCount = pendingWorkers.filter((w: any) => w.source !== "WEBSITE").length;
  const totalPending = pendingWorkers.length;

  // Filter by tab & search
  const displayedWorkers = pendingWorkers.filter((w: any) => {
    if (activeTab === "website" && w.source !== "WEBSITE") return false;
    if (activeTab === "app" && w.source === "WEBSITE") return false;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      const name = (w.user?.name || "").toLowerCase();
      const phone = (w.user?.phone || "").toLowerCase();
      const trade = (w.trade || "").toLowerCase();
      const city = (w.city || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || trade.includes(q) || city.includes(q);
    }
    return true;
  });

  const handleConfirmReject = () => {
    if (!rejectDialog) return;
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    if (rejectDialog.isWebsiteLead && rejectDialog.leadId) {
      rejectLeadMutation.mutate({ leadId: rejectDialog.leadId, reason: rejectReason.trim() });
    } else {
      verifyMutation.mutate({
        workerId: rejectDialog.workerId,
        approve: false,
        rejectReason: rejectReason.trim(),
      });
    }
  };

  const openLightbox = (fileUrl: string, docType: string, workerName: string) => {
    setLightbox({ fileUrl, docType, workerName });
    setZoomLevel(1);
    setRotation(0);
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 min-h-screen pb-16">
      <PageHeader
        title="Workforce Document Verification"
        description="Verify uploaded government IDs, photos, and trade certifications before granting live dispatch access."
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* KPI Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent shadow-xs">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/15 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pending Verification
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {totalPending}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">Workers awaiting document review</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent shadow-xs">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/15 text-blue-600">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Website Onboardings
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {websiteCount}
                </p>
                <p className="text-xs text-blue-600 mt-0.5">Awaiting 1-click Approve & Convert</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent shadow-xs">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  App Registrations
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {appCount}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">Mobile app signups for document KYC</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <Card className="shadow-xs border">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as TabType)}
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-3 w-full md:w-[480px] h-10 p-1">
                <TabsTrigger value="all" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  <span>All Pending</span>
                  {totalPending > 0 && (
                    <Badge variant="secondary" className="px-1.5 py-0 h-4.5 text-[10px] bg-amber-500/15 text-amber-700">
                      {totalPending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="website" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <Globe className="h-4 w-4" />
                  <span>Website Leads</span>
                  {websiteCount > 0 && (
                    <Badge variant="secondary" className="px-1.5 py-0 h-4.5 text-[10px] bg-blue-500/15 text-blue-700">
                      {websiteCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="app" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <Phone className="h-4 w-4" />
                  <span>App Signups</span>
                  {appCount > 0 && (
                    <Badge variant="secondary" className="px-1.5 py-0 h-4.5 text-[10px] bg-emerald-500/15 text-emerald-700">
                      {appCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9 h-10 text-sm bg-background"
                placeholder="Search by name, phone, trade, or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Workers Queue */}
        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayedWorkers.length === 0 ? (
          <Card className="py-16 text-center shadow-xs">
            <CardContent className="space-y-3">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Workforce Verification Queue Clear
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {search
                  ? `No pending workers matched "${search}".`
                  : activeTab === "website"
                    ? "No pending website gig leads waiting for conversion."
                    : activeTab === "app"
                      ? "No pending mobile app worker signups waiting for document review."
                      : "All uploaded worker documents have been reviewed. New submissions will appear here automatically."}
              </p>
              {search && (
                <Button variant="outline" size="sm" onClick={() => setSearch("")} className="mt-2">
                  Clear Search Filter
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {displayedWorkers.map((worker: any) => {
              const isWebsite = worker.source === "WEBSITE";
              const workerName = worker.user?.name || "Worker";
              const workerPhone = worker.user?.phone || "No phone";
              const leadId = worker.leadId || worker.id.replace(/^lead_/, "");

              return (
                <Card key={worker.id} className="p-6 shadow-sm border overflow-hidden">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">{workerName}</h3>
                        {isWebsite ? (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-xs gap-1 font-semibold">
                            <Globe className="h-3 w-3" />
                            WEBSITE ONBOARDING
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs font-semibold">
                            APP SIGNUP
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {workerPhone}
                        </span>
                        {worker.trade && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                            <strong className="text-slate-800">{worker.trade}</strong>
                          </span>
                        )}
                        {worker.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {worker.city}{worker.area ? `, ${worker.area}` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 font-semibold px-2.5 py-1 text-xs">
                      Pending Verification
                    </Badge>
                  </div>

                  {/* Documents Grid */}
                  <div className="pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Uploaded Verification Documents ({(worker.documents || []).length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                      {(worker.documents || []).map((doc: any) => {
                        const isPdf = String(doc.fileUrl || "").toLowerCase().includes(".pdf");
                        return (
                          <div key={doc.id || doc.type} className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold uppercase text-slate-600 truncate" title={doc.type}>
                              {doc.type}
                            </span>
                            <div
                              onClick={() => openLightbox(doc.fileUrl, doc.type, workerName)}
                              className="block relative group rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-xs hover:border-primary/50 transition-all aspect-square bg-slate-100"
                            >
                              {isPdf ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-600">
                                  <FileImage className="h-8 w-8 text-red-500 mb-1" />
                                  <span className="text-[10px] font-bold">PDF Document</span>
                                </div>
                              ) : (
                                <img
                                  src={doc.fileUrl}
                                  alt={doc.type}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                                <Eye className="h-4 w-4" />
                                <span>Inspect</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inline Verification Form (for App Workers) */}
                  {!isWebsite && verifyingId === worker.id && (
                    <div className="bg-slate-50 p-4 rounded-lg border space-y-4 mb-4 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm text-slate-800">Enter Verified Document Credentials</h4>
                        <span className="text-xs text-muted-foreground">Extracted from uploaded Aadhaar & PAN</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold mb-1 block">Aadhaar Number (12 digits)</label>
                          <Input
                            value={aadhaarNumber}
                            onChange={(e) => setAadhaarNumber(e.target.value)}
                            placeholder="000000000000"
                            maxLength={12}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block">PAN Number (10 alphanumeric)</label>
                          <Input
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            className="uppercase"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button variant="outline" size="sm" onClick={() => setVerifyingId(null)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                          disabled={verifyMutation.isPending || aadhaarNumber.length !== 12 || panNumber.length !== 10}
                          onClick={() =>
                            verifyMutation.mutate({
                              workerId: worker.id,
                              approve: true,
                              aadhaarNumber,
                              panNumber: panNumber.toUpperCase(),
                            })
                          }
                        >
                          {verifyMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approve & Verify Worker
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Bar */}
                  <div className="flex flex-wrap gap-2 justify-end border-t pt-4">
                    {isWebsite ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                          disabled={rejectLeadMutation.isPending || convertLeadMutation.isPending}
                          onClick={() => {
                            setRejectDialog({
                              workerId: worker.id,
                              workerName,
                              isWebsiteLead: true,
                              leadId,
                            });
                            setRejectReason("");
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Reject
                        </Button>
                        <Button
                          size="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md gap-2 px-5 cursor-pointer"
                          disabled={convertLeadMutation.isPending}
                          onClick={() => convertLeadMutation.mutate(leadId)}
                          title="Provisions verified worker user account, marks all documents approved, and enables immediate mobile app login"
                        >
                          {convertLeadMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-yellow-300" />
                          )}
                          Approve & Convert
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                          disabled={verifyMutation.isPending}
                          onClick={() => {
                            setRejectDialog({
                              workerId: worker.id,
                              workerName,
                              isWebsiteLead: false,
                            });
                            setRejectReason("");
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Reject Documents
                        </Button>
                        <Button
                          size="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md gap-2 px-5 cursor-pointer"
                          onClick={() => {
                            setVerifyingId(worker.id);
                            setAadhaarNumber(worker.aadhaarNumber || "");
                            setPanNumber(worker.panNumber || "");
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Verify Worker
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Inspection Lightbox Modal */}
      {lightbox && (
        <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
            <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  {lightbox.docType} — {lightbox.workerName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Inspecting verification document
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1.5 pr-6">
                <Button variant="outline" size="sm" onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRotation((r) => (r + 90) % 360)}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <a href={lightbox.fileUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    Open Full
                  </Button>
                </a>
              </div>
            </DialogHeader>

            <div className="relative min-h-[420px] max-h-[75vh] flex items-center justify-center p-4 bg-muted/40 overflow-auto">
              {lightbox.fileUrl?.toLowerCase().includes(".pdf") ? (
                <iframe src={lightbox.fileUrl} className="w-full h-[600px] border-0" title={lightbox.docType} />
              ) : (
                <img
                  src={lightbox.fileUrl}
                  alt={lightbox.docType}
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: "transform 0.15s ease",
                  }}
                  className="max-w-full max-h-[70vh] object-contain rounded-sm"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Dialog Modal */}
      {rejectDialog && (
        <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Reject Verification — {rejectDialog.workerName}
              </DialogTitle>
              <DialogDescription>
                Provide a specific reason so the worker knows what documents to resubmit.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REJECTION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className={`text-xs px-2.5 py-1 rounded-md border text-left transition-colors cursor-pointer ${
                        rejectReason === preset
                          ? "bg-destructive/15 border-destructive text-destructive font-medium"
                          : "bg-muted/50 border-muted hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Rejection Reason (Required)
                </label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Aadhaar photo is blurry, please re-upload clear image with all 4 corners visible…"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setRejectDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={
                  !rejectReason.trim() ||
                  verifyMutation.isPending ||
                  rejectLeadMutation.isPending
                }
                onClick={handleConfirmReject}
              >
                {verifyMutation.isPending || rejectLeadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1.5" />
                )}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
