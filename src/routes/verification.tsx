import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck, ShieldAlert, Clock, Search, ChevronLeft, ChevronRight,
  Loader2, CheckCircle2, XCircle, FileText, ExternalLink,
  ZoomIn, ZoomOut, RotateCw, RefreshCw, Eye, AlertTriangle,
  User, Phone, Car, Calendar, Copy, Check, Users, Sparkles,
  FileQuestion,
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useDrivers, useUpdateDocStatus, useSetDocVerified } from "@/hooks/useDrivers";
import type { DriverListItem, DriverDocument } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/verification")({
  head: () => ({ meta: [{ title: "Driver Document Verification — Parther Admin" }] }),
  component: VerificationPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Document Type Definitions & Checklist Configuration
// ─────────────────────────────────────────────────────────────────────────────

interface DocTypeConfig {
  key: string;
  label: string;
  category: "Identity" | "Vehicle";
  description: string;
  aliases?: string[];
}

const DOCUMENT_CHECKLIST: DocTypeConfig[] = [
  {
    key: "DL_FRONT",
    label: "Driving Licence (Front)",
    category: "Identity",
    description: "Front photo showing DL number, holder name & validity",
    aliases: ["DL", "DRIVING_LICENSE", "DRIVING_LICENCE_FRONT"],
  },
  {
    key: "DL_BACK",
    label: "Driving Licence (Back)",
    category: "Identity",
    description: "Back side showing vehicle class endorsements & address",
    aliases: ["DRIVING_LICENCE_BACK", "DL_REAR"],
  },
  {
    key: "RC_FRONT",
    label: "Vehicle RC (Front)",
    category: "Vehicle",
    description: "Registration Certificate front with chassis & engine number",
    aliases: ["RC", "VEHICLE_RC", "RC_BOOK"],
  },
  {
    key: "RC_BACK",
    label: "Vehicle RC (Back)",
    category: "Vehicle",
    description: "Registration Certificate back showing ownership details",
  },
  {
    key: "SELFIE",
    label: "Driver Selfie / Photo",
    category: "Identity",
    description: "Clear live face portrait for driver profile & KYC matching",
    aliases: ["PROFILE_PICTURE", "AVATAR", "PHOTO"],
  },
  {
    key: "AADHAAR_FRONT",
    label: "Aadhaar Card (Front)",
    category: "Identity",
    description: "Aadhaar card front displaying 12-digit UID and photo",
    aliases: ["AADHAAR", "AADHAR", "AADHAAR_CARD", "AADHAR_FRONT"],
  },
  {
    key: "PAN_FRONT",
    label: "PAN Card (Front)",
    category: "Identity",
    description: "Income Tax Department PAN card for TDS & bank settlement",
    aliases: ["PAN", "PAN_CARD"],
  },
  {
    key: "PERMIT",
    label: "Commercial Permit",
    category: "Vehicle",
    description: "Commercial goods carriage permit issued by state RTO",
    aliases: ["COMMERCIAL_PERMIT", "GOODS_PERMIT", "PERMIT_DOC"],
  },
  {
    key: "FITNESS",
    label: "Vehicle Fitness Certificate",
    category: "Vehicle",
    description: "Valid commercial vehicle roadworthiness certificate",
    aliases: ["FITNESS_CERTIFICATE", "FITNESS_CERT"],
  },
];

function findDriverDoc(rawDocs: DriverDocument[], item: DocTypeConfig): DriverDocument | undefined {
  const matchTypes = [item.key, ...(item.aliases || [])].map((t) => t.toUpperCase());
  return rawDocs.find((doc) => {
    if (!doc.type) return false;
    const docTypeUpper = doc.type.toUpperCase();
    return matchTypes.includes(docTypeUpper);
  });
}

function getAdditionalDriverDocs(rawDocs: DriverDocument[]): DriverDocument[] {
  const allKnownTypes = new Set<string>();
  for (const item of DOCUMENT_CHECKLIST) {
    allKnownTypes.add(item.key.toUpperCase());
    if (item.aliases) {
      for (const alias of item.aliases) {
        allKnownTypes.add(alias.toUpperCase());
      }
    }
  }
  return rawDocs.filter((doc) => {
    if (!doc.type) return true;
    return !allKnownTypes.has(doc.type.toUpperCase());
  });
}

const REJECTION_PRESETS = [
  "Blurry or unreadable photo / text",
  "Document expired / validity lapsed",
  "Name does not match application details",
  "Wrong document uploaded for this slot",
  "Corners cut off / partial document shown",
  "Vehicle registration number mismatch",
  "Tampered or edited image detected",
];

type TabType = "pending" | "all" | "verified";

interface LightboxState {
  driver: DriverListItem;
  doc: DriverDocument;
  docLabel: string;
}

function VerificationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Lightbox Modal state for full image inspection
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Rejection Dialog state
  const [rejectDialog, setRejectDialog] = useState<{
    driverId: string;
    docId: string;
    docLabel: string;
    driverName: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Queries for drivers list based on active tab
  const isDocVerifiedParam =
    activeTab === "pending" ? false : activeTab === "verified" ? true : undefined;

  const { data, isLoading, isFetching } = useDrivers({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    isDocVerified: isDocVerifiedParam,
  });

  // Auxiliary queries for live header counters
  const { data: pendingStats } = useDrivers({ page: 1, limit: 1, isDocVerified: false });
  const { data: verifiedStats } = useDrivers({ page: 1, limit: 1, isDocVerified: true });
  const { data: allStats } = useDrivers({ page: 1, limit: 1 });

  const docStatusMut = useUpdateDocStatus();
  const docVerifiedMut = useSetDocVerified();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  // 1-Click Approve single document
  const handleApproveDoc = async (driverId: string, docId: string, docLabel: string) => {
    try {
      await docStatusMut.mutateAsync({
        driverId,
        docId,
        status: "VERIFIED",
      });
      toast.success(`${docLabel} approved successfully`);
      if (lightbox?.doc.id === docId) {
        setLightbox(prev =>
          prev ? { ...prev, doc: { ...prev.doc, status: "VERIFIED", rejectedReason: null } } : null
        );
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to approve document");
    }
  };

  // Submit document rejection
  const handleConfirmReject = async () => {
    if (!rejectDialog || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      await docStatusMut.mutateAsync({
        driverId: rejectDialog.driverId,
        docId: rejectDialog.docId,
        status: "REJECTED",
        rejectedReason: rejectReason.trim(),
      });
      toast.success(`${rejectDialog.docLabel} marked as rejected`);
      if (lightbox?.doc.id === rejectDialog.docId) {
        setLightbox(prev =>
          prev
            ? {
                ...prev,
                doc: {
                  ...prev.doc,
                  status: "REJECTED",
                  rejectedReason: rejectReason.trim(),
                },
              }
            : null
        );
      }
      setRejectDialog(null);
      setRejectReason("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to reject document");
    }
  };

  // Approve entire driver & grant system access
  const handleApproveDriver = async (driverId: string, driverName: string) => {
    try {
      await docVerifiedMut.mutateAsync({ driverId, isDocVerified: true });
      toast.success(`Driver "${driverName}" approved & granted full platform access!`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to approve driver");
    }
  };

  // Revoke driver doc verification access
  const handleRevokeDriver = async (driverId: string, driverName: string) => {
    try {
      await docVerifiedMut.mutateAsync({ driverId, isDocVerified: false });
      toast.info(`Verification access revoked for "${driverName}"`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to revoke driver verification");
    }
  };

  const openLightbox = (driver: DriverListItem, doc: DriverDocument, docLabel: string) => {
    setLightbox({ driver, doc, docLabel });
    setZoomLevel(1);
    setRotation(0);
  };

  return (
    <div className="min-h-screen pb-16 bg-muted/20">
      <PageHeader
        title="Driver Document Verification"
        description="Verify uploaded government IDs, vehicle RCs, and commercial permits before granting live dispatch access."
        actions={
          isFetching ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background border px-3 py-1.5 rounded-full shadow-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Syncing drivers…</span>
            </div>
          ) : null
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
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
                  {pendingStats?.total ?? "—"}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">Drivers awaiting document review</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent shadow-xs">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fully Verified
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {verifiedStats?.total ?? "—"}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">Active with live dispatch access</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Drivers
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {allStats?.total ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Registered driver fleet</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <Card className="shadow-xs border">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val as TabType);
                setPage(1);
              }}
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-3 w-full md:w-[460px] h-10 p-1">
                <TabsTrigger value="pending" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <span>Pending</span>
                  {pendingStats?.total !== undefined && (
                    <Badge variant="secondary" className="px-1.5 py-0 h-4.5 text-[10px] bg-amber-500/15 text-amber-700">
                      {pendingStats.total}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <span>All Drivers</span>
                  {allStats?.total !== undefined && (
                    <Badge variant="secondary" className="px-1.5 py-0 h-4.5 text-[10px]">
                      {allStats.total}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="verified" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <span>Fully Verified</span>
                  {verifiedStats?.total !== undefined && (
                    <Badge variant="secondary" className="px-1.5 py-0 h-4.5 text-[10px] bg-emerald-500/15 text-emerald-700">
                      {verifiedStats.total}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9 h-10 text-sm bg-background"
                placeholder="Search by name, phone, licence, or RC…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Drivers Queue / Cards */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-40" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : data?.data?.length ? (
          <div className="space-y-6">
            {data.data.map((driver: DriverListItem) => (
              <DriverVerificationCard
                key={driver.id}
                driver={driver}
                isDocVerifiedMutating={docVerifiedMut.isPending}
                onApproveDriver={() => handleApproveDriver(driver.id, driver.user?.name ?? "Driver")}
                onRevokeDriver={() => handleRevokeDriver(driver.id, driver.user?.name ?? "Driver")}
                onApproveDoc={(docId, docLabel) => handleApproveDoc(driver.id, docId, docLabel)}
                onRejectDoc={(docId, docLabel) =>
                  setRejectDialog({
                    driverId: driver.id,
                    docId,
                    docLabel,
                    driverName: driver.user?.name ?? "Driver",
                  })
                }
                onInspectDoc={(doc, docLabel) => openLightbox(driver, doc, docLabel)}
                isDocMutating={docStatusMut.isPending}
              />
            ))}

            {/* Pagination footer */}
            <Card className="p-4 flex items-center justify-between shadow-xs">
              <span className="text-sm text-muted-foreground font-medium">
                Showing {data.data.length} of {total} driver{total === 1 ? "" : "s"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => p - 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-9 px-3"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-xs px-2 font-mono text-muted-foreground">
                  Page {page} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => p + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-9 px-3"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="py-16 text-center shadow-xs">
            <CardContent className="space-y-3">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {activeTab === "pending"
                  ? "Verification Queue Clear"
                  : "No Drivers Found"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {activeTab === "pending"
                  ? "All uploaded driver documents have been reviewed. New submissions will appear here automatically."
                  : search
                    ? `No drivers matched "${search}". Try searching by phone number, vehicle RC, or licence number.`
                    : "No drivers available in this filter tab."}
              </p>
              {search && (
                <Button variant="outline" size="sm" onClick={() => setSearch("")} className="mt-2">
                  Clear Search Filter
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          Full Image Zoom / Lightbox Modal
          ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-background border shadow-2xl">
          {lightbox && (
            <>
              {/* Lightbox Header */}
              <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0 bg-card">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {lightbox.docLabel}
                    </DialogTitle>
                    <StatusBadge status={lightbox.doc.status} />
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground flex items-center gap-3">
                    <span>Driver: <strong>{lightbox.driver.user?.name ?? "—"}</strong> ({lightbox.driver.user?.phone})</span>
                    <span>•</span>
                    <span>Licence: {lightbox.driver.licenseNumber}</span>
                    {lightbox.driver.vehicle && (
                      <>
                        <span>•</span>
                        <span>Vehicle: {lightbox.driver.vehicle.registrationNo}</span>
                      </>
                    )}
                  </DialogDescription>
                </div>

                {/* Zoom & Inspection Controls */}
                <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Zoom Out"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-mono px-1 min-w-12 text-center text-muted-foreground">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Zoom In"
                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Rotate 90°"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Reset Zoom & Rotation"
                    onClick={() => {
                      setZoomLevel(1);
                      setRotation(0);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {lightbox.doc.fileUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Open Original in New Tab"
                      asChild
                    >
                      <a href={lightbox.doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </DialogHeader>

              {/* Lightbox Image Viewport */}
              <div className="flex-1 overflow-auto bg-slate-950/95 flex items-center justify-center p-4 relative select-none">
                {lightbox.doc.fileUrl ? (
                  <div
                    className="transition-transform duration-150 ease-out flex items-center justify-center"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transformOrigin: "center center",
                    }}
                  >
                    <img
                      src={lightbox.doc.fileUrl}
                      alt={lightbox.docLabel}
                      className="max-h-[70vh] max-w-[80vw] object-contain rounded-sm shadow-2xl pointer-events-auto"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-slate-400 space-y-3">
                    <FileQuestion className="h-16 w-16 mx-auto opacity-50" />
                    <p className="text-sm">No raw image file URL is attached to this document record.</p>
                  </div>
                )}
              </div>

              {/* Lightbox Footer Actions */}
              <div className="px-6 py-3 border-t bg-card flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-muted-foreground">
                  {lightbox.doc.status === "REJECTED" && lightbox.doc.rejectedReason ? (
                    <span className="text-destructive font-medium flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Rejected Reason: {lightbox.doc.rejectedReason}
                    </span>
                  ) : (
                    <span>Inspect full clarity, validity date, and document details before making a decision.</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={docStatusMut.isPending}
                    onClick={() => {
                      setRejectDialog({
                        driverId: lightbox.driver.id,
                        docId: lightbox.doc.id,
                        docLabel: lightbox.docLabel,
                        driverName: lightbox.driver.user?.name ?? "Driver",
                      });
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Reject Document…
                  </Button>

                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={docStatusMut.isPending || lightbox.doc.status === "VERIFIED"}
                    onClick={() =>
                      handleApproveDoc(lightbox.driver.id, lightbox.doc.id, lightbox.docLabel)
                    }
                  >
                    {docStatusMut.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    )}
                    {lightbox.doc.status === "VERIFIED" ? "Approved" : "Approve Document"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────────────────────
          Reject Reason Dialog
          ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={!!rejectDialog}
        onOpenChange={() => {
          setRejectDialog(null);
          setRejectReason("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Reject {rejectDialog?.docLabel}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Driver: <strong>{rejectDialog?.driverName}</strong>. Specify a clear reason so the driver can correct and re-upload the document.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Quick Reason
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {REJECTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectReason(preset)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer text-left ${
                    rejectReason === preset
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "bg-muted/50 hover:bg-muted text-foreground border-border"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-semibold">Detailed Reason / Driver Guidance *</Label>
              <Textarea
                placeholder="Explain why this document was rejected and what the driver should upload instead…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectDialog(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={docStatusMut.isPending || !rejectReason.trim()}
              onClick={handleConfirmReject}
            >
              {docStatusMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver Verification Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface DriverCardProps {
  driver: DriverListItem;
  isDocVerifiedMutating: boolean;
  onApproveDriver: () => void;
  onRevokeDriver: () => void;
  onApproveDoc: (docId: string, docLabel: string) => void;
  onRejectDoc: (docId: string, docLabel: string) => void;
  onInspectDoc: (doc: DriverDocument, docLabel: string) => void;
  isDocMutating: boolean;
}

function DriverVerificationCard({
  driver,
  isDocVerifiedMutating,
  onApproveDriver,
  onRevokeDriver,
  onApproveDoc,
  onRejectDoc,
  onInspectDoc,
  isDocMutating,
}: DriverCardProps) {
  const [copied, setCopied] = useState(false);

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopied(true);
    toast.success("Phone number copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const rawDocs = driver.documents ?? [];

  // Match checklist items with driver's uploaded documents
  const checklistItems = DOCUMENT_CHECKLIST.map((item) => {
    const uploaded = findDriverDoc(rawDocs, item);
    return { config: item, doc: uploaded };
  });

  // Find any extra documents uploaded outside the standard 9
  const extraDocs = getAdditionalDriverDocs(rawDocs);

  // Verification metrics
  const uploadedCount = rawDocs.length;
  const verifiedCount = rawDocs.filter((d) => d.status === "VERIFIED").length;
  const rejectedCount = rawDocs.filter((d) => d.status === "REJECTED").length;
  const pendingCount = rawDocs.filter((d) => d.status === "PENDING").length;

  const selfieDoc = rawDocs.find(
    (d) => d.type?.toUpperCase() === "SELFIE" || d.type?.toUpperCase() === "PHOTO"
  );

  const registeredDate = driver.createdAt
    ? new Date(driver.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <Card className="overflow-hidden border shadow-sm transition-all hover:shadow-md">
      {/* Top Header Row with Driver Details */}
      <div className="bg-card p-5 border-b space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Driver Avatar & Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-primary/20 bg-muted shrink-0 shadow-xs">
              {selfieDoc?.fileUrl ? (
                <img
                  src={selfieDoc.fileUrl}
                  alt={driver.user?.name ?? "Driver"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                  {driver.user?.name ? driver.user.name.substring(0, 2).toUpperCase() : "DR"}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  {driver.user?.name ?? "Unnamed Driver"}
                </h3>
                {driver.isDocVerified ? (
                  <Badge className="bg-emerald-600 text-white font-medium text-xs gap-1 py-0.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Partner
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs gap-1 py-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    Pending Verification
                  </Badge>
                )}
                {driver.user?.isActive ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[11px]">
                    Active Account
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground text-[11px]">
                    Inactive
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => driver.user?.phone && copyPhone(driver.user.phone)}
                  className="flex items-center gap-1 font-mono text-foreground hover:text-primary transition-colors cursor-pointer"
                  title="Click to copy phone number"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{driver.user?.phone ?? "No phone"}</span>
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground opacity-60" />
                  )}
                </button>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {registeredDate}
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] text-muted-foreground/80">
                  ID: {driver.id.substring(0, 8)}…
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: Prominent "Approve Driver & Grant Access" button */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {driver.isDocVerified ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 font-medium text-xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Live Dispatch Access Active</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                  disabled={isDocVerifiedMutating}
                  onClick={onRevokeDriver}
                  title="Revoke live verification and set driver status to OFFLINE"
                >
                  Revoke
                </Button>
              </div>
            ) : (
              <Button
                size="default"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md gap-2 px-5 cursor-pointer"
                disabled={isDocVerifiedMutating}
                onClick={onApproveDriver}
              >
                {isDocVerifiedMutating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
                Approve Driver & Grant Access
              </Button>
            )}
          </div>
        </div>

        {/* Driver Meta Bar: Vehicle, DL, and Compliance Score */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t bg-muted/20 -mx-5 -mb-5 px-5 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Car className="h-3 w-3" /> Vehicle Registration
            </p>
            <p className="font-mono text-sm font-semibold text-foreground mt-0.5">
              {driver.vehicle?.registrationNo ?? "Not Registered"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground capitalize">
                {driver.vehicle?.type ? driver.vehicle.type.replace(/_/g, " ").toLowerCase() : "No vehicle"}
              </span>
              {driver.vehicle?.rcVerifStatus && (
                <StatusBadge status={driver.vehicle.rcVerifStatus} />
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Driving Licence
            </p>
            <p className="font-mono text-sm font-semibold text-foreground mt-0.5">
              {driver.licenseNumber || "—"}
            </p>
            <div className="mt-0.5">
              <StatusBadge status={driver.dlVerifStatus} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Compliance Score
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-bold text-foreground">
                {driver.complianceScore !== undefined ? `${driver.complianceScore}%` : "—"}
              </p>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    (driver.complianceScore ?? 0) >= 80
                      ? "bg-emerald-500"
                      : (driver.complianceScore ?? 0) >= 50
                        ? "bg-amber-500"
                        : "bg-destructive"
                  }`}
                  style={{ width: `${driver.complianceScore ?? 0}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automated KYC checklist</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Document Audit
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                {verifiedCount} Approved
              </Badge>
              {pendingCount > 0 && (
                <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-700 border-amber-500/30">
                  {pendingCount} Pending
                </Badge>
              )}
              {rejectedCount > 0 && (
                <Badge variant="outline" className="text-[10px] bg-destructive/15 text-destructive border-destructive/30">
                  {rejectedCount} Rejected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Checklist & Visual Verification Grid */}
      <div className="p-5 space-y-3 bg-muted/10">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>Mandatory Document Checklist & Visual Previews</span>
            <Badge variant="secondary" className="font-normal text-[11px]">
              {uploadedCount} Uploaded
            </Badge>
          </h4>
          <span className="text-[11px] text-muted-foreground">
            Click any thumbnail to inspect high-resolution details in lightbox
          </span>
        </div>

        {/* 9-Document Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {checklistItems.map(({ config, doc }) => (
            <DocumentCard
              key={config.key}
              config={config}
              doc={doc}
              onApproveDoc={() => doc && onApproveDoc(doc.id, config.label)}
              onRejectDoc={() => doc && onRejectDoc(doc.id, config.label)}
              onInspectDoc={() => doc && onInspectDoc(doc, config.label)}
              isDocMutating={isDocMutating}
            />
          ))}

          {/* Any additional custom documents uploaded */}
          {extraDocs.map((doc) => {
            const customConfig: DocTypeConfig = {
              key: doc.type,
              label: doc.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              category: "Vehicle",
              description: "Custom supplementary driver upload",
            };
            return (
              <DocumentCard
                key={doc.id}
                config={customConfig}
                doc={doc}
                onApproveDoc={() => onApproveDoc(doc.id, customConfig.label)}
                onRejectDoc={() => onRejectDoc(doc.id, customConfig.label)}
                onInspectDoc={() => onInspectDoc(doc, customConfig.label)}
                isDocMutating={isDocMutating}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Document Checklist Item Card
// ─────────────────────────────────────────────────────────────────────────────

interface DocumentCardProps {
  config: DocTypeConfig;
  doc?: DriverDocument;
  onApproveDoc: () => void;
  onRejectDoc: () => void;
  onInspectDoc: () => void;
  isDocMutating: boolean;
}

function DocumentCard({
  config,
  doc,
  onApproveDoc,
  onRejectDoc,
  onInspectDoc,
  isDocMutating,
}: DocumentCardProps) {
  const isUploaded = !!doc;
  const status = doc?.status ?? "PENDING";

  return (
    <div
      className={`rounded-xl border p-3 flex flex-col justify-between transition-all bg-card ${
        isUploaded
          ? status === "VERIFIED"
            ? "border-emerald-500/30 bg-emerald-500/[0.02]"
            : status === "REJECTED"
              ? "border-destructive/30 bg-destructive/[0.02]"
              : "border-amber-500/30 bg-amber-500/[0.02]"
          : "border-dashed border-muted-foreground/25 bg-muted/15"
      }`}
    >
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded-sm bg-muted">
            {config.category}
          </span>
          {isUploaded ? (
            <StatusBadge status={status} />
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30">
              Not Uploaded
            </Badge>
          )}
        </div>
        <p className="text-xs font-semibold text-foreground line-clamp-1" title={config.label}>
          {config.label}
        </p>
      </div>

      {/* Visual Thumbnail or Placeholder */}
      <div className="my-2.5">
        {isUploaded ? (
          doc?.fileUrl ? (
            <div
              onClick={onInspectDoc}
              className="group relative h-32 w-full rounded-lg overflow-hidden border bg-slate-950/5 cursor-pointer shadow-2xs hover:shadow-xs transition-all"
              title="Click to inspect in Lightbox"
            >
              <img
                src={doc.fileUrl}
                alt={config.label}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                  (e.target as HTMLElement).nextElementSibling?.classList.remove("hidden");
                }}
              />
              {/* Fallback icon if image error */}
              <div className="hidden absolute inset-0 flex flex-col items-center justify-center p-2 bg-muted text-muted-foreground text-center">
                <FileText className="h-6 w-6 mb-1 opacity-50" />
                <span className="text-[11px]">Preview unavailable (click to open)</span>
              </div>

              {/* Hover inspection overlay */}
              <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white font-medium text-xs">
                <Eye className="h-4 w-4" />
                <span>Inspect</span>
              </div>
            </div>
          ) : (
            <div
              onClick={onInspectDoc}
              className="h-32 w-full rounded-lg border border-dashed flex flex-col items-center justify-center gap-1.5 bg-muted/30 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <FileText className="h-7 w-7 opacity-60" />
              <span className="text-[11px] font-medium">Record uploaded (no image)</span>
              <span className="text-[10px] text-primary">Click to inspect</span>
            </div>
          )
        ) : (
          <div className="h-32 w-full rounded-lg border border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-1 text-muted-foreground/70 p-3 text-center">
            <FileQuestion className="h-7 w-7 opacity-40 mb-0.5" />
            <span className="text-xs font-medium">Missing Document</span>
            <span className="text-[10px] leading-tight text-muted-foreground/60">
              {config.description}
            </span>
          </div>
        )}
      </div>

      {/* Rejection Alert if present */}
      {isUploaded && status === "REJECTED" && doc?.rejectedReason && (
        <div className="mb-2.5 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-2">Reason: {doc.rejectedReason}</span>
        </div>
      )}

      {/* Action Toolbar for Uploaded Document */}
      {isUploaded ? (
        <div className="flex items-center gap-1.5 pt-1 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={onInspectDoc}
          >
            <Eye className="h-3 w-3 mr-1" />
            Inspect
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 ${
              status === "REJECTED" ? "bg-destructive/10 font-semibold" : ""
            }`}
            disabled={isDocMutating}
            onClick={onRejectDoc}
            title="Reject this document"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Reject
          </Button>

          <Button
            type="button"
            size="sm"
            className={`h-7 px-2.5 text-[11px] font-semibold text-white ${
              status === "VERIFIED"
                ? "bg-emerald-700 hover:bg-emerald-800"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            disabled={isDocMutating || status === "VERIFIED"}
            onClick={onApproveDoc}
            title="Approve this document"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {status === "VERIFIED" ? "Approved" : "Approve"}
          </Button>
        </div>
      ) : (
        <div className="pt-1 border-t text-center">
          <span className="text-[10px] text-muted-foreground/60 italic">
            Required for full verification
          </span>
        </div>
      )}
    </div>
  );
}
