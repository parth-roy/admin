import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, Loader2, Edit, CheckCircle,
  XCircle, Eye, Trash2, X, Wallet, Ban, ShieldCheck, ShieldOff,
  Download, ChevronDown, FileSpreadsheet,
} from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useWorkforce, useUpdateWorkerBank, useCreditWorkerWallet,
  useWorker, useSuspendWorker, useRevokeWorkerVerification,
  useSoftDeleteWorker, useHardDeleteWorker, useBulkHardDeleteWorkers,
} from "@/hooks/useWorkforce";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { BulkDeleteConfirmDialog } from "@/components/admin/BulkDeleteConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

function generateExcelXml(headers: string[], rows: (string | number)[][]): string {
  const sanitizeXml = (str: any) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Workforce">
  <Table>`;

  xml += '\n   <Row ss:Height="24">';
  for (const h of headers) {
    xml += `\n    <Cell ss:StyleID="Header"><Data ss:Type="String">${sanitizeXml(h)}</Data></Cell>`;
  }
  xml += "\n   </Row>";

  for (const row of rows) {
    xml += "\n   <Row>";
    for (const cell of row) {
      const isNum = typeof cell === "number" && !isNaN(cell);
      const type = isNum ? "Number" : "String";
      xml += `\n    <Cell><Data ss:Type="${type}">${sanitizeXml(cell)}</Data></Cell>`;
    }
    xml += "\n   </Row>";
  }

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;
  return xml;
}

export const Route = createFileRoute("/workforce")({
  head: () => ({ meta: [{ title: "Workforce — SUPER ADMIN" }] }),
  component: WorkforcePage,
});

function WorkforcePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [workStatus, setWorkStatus] = useState("all");
  const [docStatus, setDocStatus] = useState("all");
  const [bankStatus, setBankStatus] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");

  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [creditingWorker, setCreditingWorker] = useState<any>(null);
  const [viewingWorkerId, setViewingWorkerId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useWorkforce({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    status: workStatus !== "all" ? workStatus : undefined,
    isDocVerified: docStatus === "verified" ? true : docStatus === "unverified" ? false : undefined,
    bankVerified: bankStatus === "verified" ? true : bankStatus === "unverified" ? false : undefined,
    isActive: activeStatus === "active" ? true : activeStatus === "suspended" ? false : undefined,
  });

  const suspendMut = useSuspendWorker();
  const softDeleteMut = useSoftDeleteWorker();
  const hardDeleteMut = useHardDeleteWorker();
  const bulkHardDeleteMut = useBulkHardDeleteWorkers();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25) || 1;
  const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-IN") : "—");

  const pageIds = data?.data?.map((w: any) => w.id) ?? [];
  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id: string) => selectedIds.has(id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const next = new Set(selectedIds);
      pageIds.forEach((id: string) => next.delete(id));
      setSelectedIds(next);
      setSelectAllFiltered(false);
    } else {
      const next = new Set(selectedIds);
      pageIds.forEach((id: string) => next.add(id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
      setSelectAllFiltered(false);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const resetFilters = () => {
    setSearch("");
    setWorkStatus("all");
    setDocStatus("all");
    setBankStatus("all");
    setActiveStatus("all");
    setPage(1);
    setSelectedIds(new Set());
    setSelectAllFiltered(false);
  };

  const handleConfirmBulkDelete = async (reason: string) => {
    try {
      const payload: any = { reason };
      if (selectAllFiltered) {
        payload.selectAllFiltered = true;
        payload.filter = {
          status: workStatus !== "all" ? workStatus : undefined,
          isDocVerified: docStatus === "verified" ? true : docStatus === "unverified" ? false : undefined,
          bankVerified: bankStatus === "verified" ? true : bankStatus === "unverified" ? false : undefined,
          isActive: activeStatus === "active" ? true : activeStatus === "suspended" ? false : undefined,
          search: debouncedSearch || undefined,
        };
      } else {
        payload.ids = Array.from(selectedIds);
      }

      const res = await bulkHardDeleteMut.mutateAsync(payload);
      toast.success(`Successfully permanently deleted ${res.deletedCount} worker(s).`);
      if (res.skippedCount > 0) {
        toast.warning(`Skipped ${res.skippedCount} worker(s) due to active job assignments.`);
      }
      setSelectedIds(new Set());
      setSelectAllFiltered(false);
      setIsBulkDeleteOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to bulk delete workers");
    }
  };

  const handleExport = async (
    format: "csv" | "xls" = "csv",
    scope: "all" | "selected" | "page" = "all"
  ) => {
    try {
      setIsExporting(true);
      toast.info(
        `Preparing ${
          scope === "selected"
            ? "selected"
            : scope === "page"
            ? "page"
            : "workforce"
        } data export…`
      );

      let workersToExport: any[] = [];

      if (scope === "selected") {
        if (selectedIds.size === 0) {
          toast.warning("No workers selected to export");
          setIsExporting(false);
          return;
        }
        if (selectAllFiltered) {
          const res = await apiClient.get("/admin/workforce", {
            params: {
              page: 1,
              limit: Math.min(Math.max(total, 1), 10000),
              search: debouncedSearch || undefined,
              status: workStatus !== "all" ? workStatus : undefined,
              isDocVerified:
                docStatus === "verified"
                  ? true
                  : docStatus === "unverified"
                  ? false
                  : undefined,
              bankVerified:
                bankStatus === "verified"
                  ? true
                  : bankStatus === "unverified"
                  ? false
                  : undefined,
              isActive:
                activeStatus === "active"
                  ? true
                  : activeStatus === "suspended"
                  ? false
                  : undefined,
            },
          });
          workersToExport = res.data?.data?.data || [];
        } else {
          const pageWorkers = data?.data || [];
          const matched = pageWorkers.filter((w: any) => selectedIds.has(w.id));
          if (matched.length === selectedIds.size) {
            workersToExport = matched;
          } else {
            const res = await apiClient.get("/admin/workforce", {
              params: {
                page: 1,
                limit: Math.min(Math.max(total, 1), 10000),
                search: debouncedSearch || undefined,
                status: workStatus !== "all" ? workStatus : undefined,
                isDocVerified:
                  docStatus === "verified"
                    ? true
                    : docStatus === "unverified"
                    ? false
                    : undefined,
                bankVerified:
                  bankStatus === "verified"
                    ? true
                    : bankStatus === "unverified"
                    ? false
                    : undefined,
                isActive:
                  activeStatus === "active"
                    ? true
                    : activeStatus === "suspended"
                    ? false
                    : undefined,
              },
            });
            const allFetched = res.data?.data?.data || [];
            workersToExport = allFetched.filter((w: any) => selectedIds.has(w.id));
          }
        }
      } else if (scope === "page") {
        workersToExport = data?.data || [];
      } else {
        if (total === 0) {
          toast.warning("No workforce members found to export");
          setIsExporting(false);
          return;
        }
        if (data?.data && data.data.length >= total) {
          workersToExport = data.data;
        } else {
          const res = await apiClient.get("/admin/workforce", {
            params: {
              page: 1,
              limit: Math.min(Math.max(total, 1), 10000),
              search: debouncedSearch || undefined,
              status: workStatus !== "all" ? workStatus : undefined,
              isDocVerified:
                docStatus === "verified"
                  ? true
                  : docStatus === "unverified"
                  ? false
                  : undefined,
              bankVerified:
                bankStatus === "verified"
                  ? true
                  : bankStatus === "unverified"
                  ? false
                  : undefined,
              isActive:
                activeStatus === "active"
                  ? true
                  : activeStatus === "suspended"
                  ? false
                  : undefined,
            },
          });
          workersToExport = res.data?.data?.data || [];
        }
      }

      if (!workersToExport || workersToExport.length === 0) {
        toast.warning("No workers found to export");
        setIsExporting(false);
        return;
      }

      const headers = [
        "Worker ID",
        "User ID",
        "Full Name",
        "Phone Number",
        "Email Address",
        "Profile Image URL",
        "Account Status",
        "Work Status",
        "Document Verification",
        "Digilocker Aadhaar Status",
        "Aadhaar Number (Masked)",
        "Digilocker PAN Status",
        "PAN Number",
        "Uploaded Documents",
        "Bank Account Verified",
        "Bank Name",
        "Bank Account Number",
        "Bank IFSC Code",
        "Bank Account Holder Name",
        "Wallet Balance (INR)",
        "Rating",
        "Completed Jobs",
        "Acceptance Rate (%)",
        "Preferred Work / Description",
        "Preferred Work Categories",
        "Max Lifting Capacity (kg)",
        "Vehicle Access",
        "Available Shift / Hours",
        "Preferred Distance (km)",
        "Languages Known",
        "Gamification Tier",
        "Gamification Points",
        "Latitude",
        "Longitude",
        "Joined / Registered Date",
        "Last Location Update",
      ];

      const rows = workersToExport.map((w: any) => {
        const isSuspended = w.isActive === false || w.user?.isActive === false;
        const accountStatus = isSuspended ? "Suspended" : "Active";
        const docStatusText = w.isDocVerified
          ? "Verified"
          : w.documents?.some((d: any) => d.status === "PENDING")
          ? "Pending"
          : "Unverified";
        const docsSummary =
          Array.isArray(w.documents) && w.documents.length > 0
            ? w.documents
                .map((d: any) => `${d.type || "DOC"}: ${d.status || "UNKNOWN"}`)
                .join("; ")
            : "None";
        const prefTypes = Array.isArray(w.preferredTypes)
          ? w.preferredTypes.join(", ")
          : w.preferredTypes || "";
        const langs = Array.isArray(w.languages)
          ? w.languages.join(", ")
          : w.languages || "";

        return [
          w.id || "",
          w.userId || w.user?.id || "",
          w.user?.name || "Unknown",
          w.user?.phone || "",
          w.user?.email || "",
          w.user?.profileImageUrl || "",
          accountStatus,
          w.status || "OFFLINE",
          docStatusText,
          w.aadhaarVerifStatus || "PENDING",
          w.aadhaarNumber ? `'${w.aadhaarNumber}` : "",
          w.panVerifStatus || "PENDING",
          w.panNumber || "",
          docsSummary,
          w.bankVerified ? "Verified" : "Unverified",
          w.bankName || "",
          w.bankAccountNo ? `'${w.bankAccountNo}` : "",
          w.bankIfsc || "",
          w.bankAccountHolderName || "",
          Number(w.workerWallet?.cachedBalance ?? 0),
          Number(w.rating ?? 5.0),
          Number(w._count?.jobAssignments ?? w.totalJobs ?? 0),
          Number(w.acceptanceRate ?? 100),
          w.preferredWork || "",
          prefTypes,
          Number(w.maxWeightKg ?? 100),
          w.vehicleAccess ? "Yes" : "No",
          w.availableTime || "",
          Number(w.preferredDistance ?? 25),
          langs,
          w.gamificationTier || "BRONZE",
          Number(w.gamificationPoints ?? 0),
          w.currentLat != null ? Number(w.currentLat) : "",
          w.currentLng != null ? Number(w.currentLng) : "",
          w.createdAt ? new Date(w.createdAt).toLocaleString("en-IN") : "",
          w.lastLocationAt
            ? new Date(w.lastLocationAt).toLocaleString("en-IN")
            : "",
        ];
      });

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);

      if (format === "xls") {
        const xml = generateExcelXml(headers, rows);
        const blob = new Blob([xml], {
          type: "application/vnd.ms-excel;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `workforce-data-${timestamp}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(
          `Successfully exported ${workersToExport.length} worker(s) to Excel (.xls)`
        );
      } else {
        const escapeCsvCell = (val: any): string => {
          if (val === null || val === undefined) return '""';
          const str = String(val);
          return `"${str.replace(/"/g, '""')}"`;
        };
        const csvContent =
          "\uFEFF" +
          [
            headers.map(escapeCsvCell).join(","),
            ...rows.map((r) => r.map(escapeCsvCell).join(",")),
          ].join("\r\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `workforce-data-${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(
          `Successfully exported ${workersToExport.length} worker(s) to CSV`
        );
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to export workforce data"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const hasFilters =
    search ||
    workStatus !== "all" ||
    docStatus !== "all" ||
    bankStatus !== "all" ||
    activeStatus !== "all";

  return (
    <div>
      <PageHeader
        title="Workforce"
        description={
          total
            ? `${total.toLocaleString("en-IN")} registered workforce members`
            : "Loading…"
        }
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting || total === 0}
                className="h-9 gap-1.5 text-xs font-semibold shadow-xs"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export CSV / XLSX
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">
                Export Options
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleExport("csv", "all")}
                className="cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                Export All Filtered (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("xls", "all")}
                className="cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                Export All Filtered (Excel .xls)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {selectedIds.size > 0 && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleExport("csv", "selected")}
                    className="cursor-pointer font-medium text-primary"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-2" />
                    Export Selected (
                    {selectAllFiltered
                      ? total.toLocaleString("en-IN")
                      : selectedIds.size}
                    ) (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("xls", "selected")}
                    className="cursor-pointer font-medium text-primary"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                    Export Selected (
                    {selectAllFiltered
                      ? total.toLocaleString("en-IN")
                      : selectedIds.size}
                    ) (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => handleExport("csv", "page")}
                className="cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                Export Current Page ({data?.data?.length || 0})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <div className="space-y-4 p-6">
        {/* Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search by worker name, phone or email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={workStatus} onValueChange={(v) => { setWorkStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Work Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Work Statuses</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ON_JOB">On Job</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={docStatus} onValueChange={(v) => { setDocStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Doc Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doc Statuses</SelectItem>
                <SelectItem value="verified">Docs Verified</SelectItem>
                <SelectItem value="unverified">Docs Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bankStatus} onValueChange={(v) => { setBankStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Bank Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bank Statuses</SelectItem>
                <SelectItem value="verified">Bank Verified</SelectItem>
                <SelectItem value="unverified">Bank Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeStatus} onValueChange={(v) => { setActiveStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Account Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Account Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv", "all")}
                disabled={isExporting || total === 0}
                className="h-9 gap-1.5 text-xs font-semibold"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export CSV / XLSX
              </Button>
              {hasFilters && total > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectAllFiltered(true);
                    setIsBulkDeleteOpen(true);
                  }}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete All Filtered ({total.toLocaleString("en-IN")})
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <Card>
          {/* Bulk Selection Bar */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-red-50/90 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 text-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="font-bold">
                  {selectAllFiltered
                    ? `All ${total.toLocaleString("en-IN")} filtered workers selected`
                    : `${selectedIds.size} worker${selectedIds.size > 1 ? "s" : ""} selected on this page`}
                </span>
                {total > (data?.data?.length ?? 0) && !selectAllFiltered && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-semibold text-red-700 underline dark:text-red-400"
                    onClick={() => setSelectAllFiltered(true)}
                  >
                    Select all {total.toLocaleString("en-IN")} workers matching filter
                  </Button>
                )}
                {selectAllFiltered && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-semibold text-red-700 underline dark:text-red-400"
                    onClick={() => setSelectAllFiltered(false)}
                  >
                    Limit to page selection only ({selectedIds.size})
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 font-medium border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40"
                  onClick={() => handleExport("csv", "selected")}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Export Selected (
                  {selectAllFiltered
                    ? total.toLocaleString("en-IN")
                    : selectedIds.size}
                  )
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => {
                    setSelectedIds(new Set());
                    setSelectAllFiltered(false);
                  }}
                >
                  Deselect All
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs gap-1.5 font-bold"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Bulk Delete ({selectAllFiltered ? total.toLocaleString("en-IN") : selectedIds.size})
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            {isFetching && !isLoading && (
              <div className="absolute right-4 top-4 z-10">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={isAllPageSelected}
                      onCheckedChange={toggleSelectAllPage}
                      aria-label="Select all on this page"
                    />
                  </TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Work Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead className="text-right">Wallet</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length ? (
                  data.data.map((worker: any) => (
                    <TableRow key={worker.id} className="hover:bg-muted/40">
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedIds.has(worker.id)}
                          onCheckedChange={() => toggleSelectOne(worker.id)}
                          aria-label={`Select ${worker.user?.name ?? worker.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setViewingWorkerId(worker.id)}
                          className="font-medium text-sm text-info hover:underline text-left cursor-pointer"
                        >
                          {worker.user?.name || "—"}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{worker.user?.phone}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            worker.isActive !== false && worker.user?.isActive !== false
                              ? "text-success border-success/40"
                              : "text-destructive border-destructive/40"
                          }
                        >
                          {worker.isActive !== false && worker.user?.isActive !== false ? "Active" : "Suspended"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={worker.status} />
                      </TableCell>
                      <TableCell>
                        {worker.isDocVerified ? (
                          <Badge variant="outline" className="text-success border-success/40">
                            Verified
                          </Badge>
                        ) : worker.documents?.some((d: any) => d.status === "PENDING") ? (
                          <Badge variant="outline" className="text-info border-info/40">
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning border-warning/40">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {worker.bankVerified ? (
                          <Badge variant="outline" className="text-success border-success/40">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning border-warning/40">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        ₹{Number(worker.workerWallet?.cachedBalance ?? 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(worker.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          {/* Profile */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2"
                            onClick={() => setViewingWorkerId(worker.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />Profile
                          </Button>
                          {/* Bank */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2"
                            onClick={() => setEditingWorker(worker)}
                          >
                            <Edit className="h-3 w-3 mr-1" />Bank
                          </Button>
                          {/* Wallet Credit */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 text-info hover:text-info/80"
                            onClick={() => setCreditingWorker(worker)}
                          >
                            <Wallet className="h-3 w-3 mr-1" />Credit
                          </Button>
                          {/* Suspend / Activate */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 text-xs px-2 ${
                              worker.isActive !== false
                                ? "text-amber-600 hover:text-amber-700"
                                : "text-success hover:text-success/80"
                            }`}
                            disabled={loadingId === `${worker.id}-suspend`}
                            onClick={async () => {
                              setLoadingId(`${worker.id}-suspend`);
                              const nextActive = worker.isActive === false;
                              try {
                                await suspendMut.mutateAsync({ id: worker.id, isActive: nextActive });
                                toast.success(nextActive ? "Worker activated" : "Worker suspended");
                              } catch {
                                toast.error("Action failed");
                              } finally {
                                setLoadingId(null);
                              }
                            }}
                          >
                            {loadingId === `${worker.id}-suspend` ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : worker.isActive !== false ? (
                              <Ban className="h-3 w-3 mr-1" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {worker.isActive !== false ? "Suspend" : "Activate"}
                          </Button>
                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(worker)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                      No workforce members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
            <span>
              {total > 0
                ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)} of ${total}`
                : "No results"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />Previous
              </Button>
              <span className="text-xs">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      {editingWorker && (
        <BankDetailsDialog
          worker={editingWorker}
          open={!!editingWorker}
          onOpenChange={(open) => !open && setEditingWorker(null)}
        />
      )}

      {creditingWorker && (
        <CreditWalletDialog
          worker={creditingWorker}
          open={!!creditingWorker}
          onOpenChange={(open) => !open && setCreditingWorker(null)}
        />
      )}

      {viewingWorkerId && (
        <WorkerProfileDialog
          workerId={viewingWorkerId}
          open={!!viewingWorkerId}
          onOpenChange={(open) => !open && setViewingWorkerId(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          entityLabel="Worker"
          entityName={deleteTarget.user?.name ?? deleteTarget.user?.phone ?? "Worker"}
          softDeleteLabel="Deactivate Worker Account"
          onSoftDelete={async (reason) => {
            await softDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Worker account deactivated");
            setDeleteTarget(null);
          }}
          onHardDelete={async (reason) => {
            await hardDeleteMut.mutateAsync({ id: deleteTarget.id, reason });
            toast.success("Worker permanently deleted");
            setDeleteTarget(null);
          }}
        />
      )}

      <BulkDeleteConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        entityLabel="Workforce Members"
        selectedCount={selectAllFiltered ? total : selectedIds.size}
        onConfirm={handleConfirmBulkDelete}
        isLoading={bulkHardDeleteMut.isPending}
      />
    </div>
  );
}

function CreditWalletDialog({
  worker,
  open,
  onOpenChange,
}: {
  worker: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const creditWallet = useCreditWorkerWallet();

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    creditWallet.mutate(
      {
        workerId: worker.id,
        amount: numAmount,
        note,
      },
      {
        onSuccess: () => {
          toast.success(`₹${numAmount} credited to wallet`);
          onOpenChange(false);
          setAmount("");
          setNote("");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Credit Wallet — {worker?.user?.name || worker?.user?.phone}</DialogTitle>
          <DialogDescription>Add funds directly to this worker's wallet.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Reason for crediting..."
              rows={2}
              className="resize-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={creditWallet.isPending || !amount}>
            {creditWallet.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Credit Wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BankDetailsDialog({
  worker,
  open,
  onOpenChange,
}: {
  worker: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [bankAccountNo, setBankAccountNo] = useState(worker?.bankAccountNo || "");
  const [bankIfsc, setBankIfsc] = useState(worker?.bankIfsc || "");
  const [bankName, setBankName] = useState(worker?.bankName || "");
  const [bankAccountHolderName, setBankAccountHolderName] = useState(
    worker?.bankAccountHolderName || ""
  );
  const [bankVerified, setBankVerified] = useState<boolean>(worker?.bankVerified || false);

  const updateBank = useUpdateWorkerBank();

  const handleSave = () => {
    updateBank.mutate(
      {
        id: worker.id,
        data: {
          bankAccountNo,
          bankIfsc,
          bankName,
          bankAccountHolderName,
          bankVerified,
        },
      },
      {
        onSuccess: () => {
          toast.success("Bank details updated");
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bank Details — {worker?.user?.name}</DialogTitle>
          <DialogDescription>Update or verify the bank details for this worker.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Account Number</Label>
            <Input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">IFSC Code</Label>
            <Input
              value={bankIfsc}
              onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Bank Name</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Account Holder Name</Label>
            <Input
              value={bankAccountHolderName}
              onChange={(e) => setBankAccountHolderName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="verified"
              checked={bankVerified}
              onChange={(e) => setBankVerified(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="verified" className="text-sm font-medium cursor-pointer">
              Mark Bank Account as Verified
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateBank.isPending}>
            {updateBank.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkerProfileDialog({
  workerId,
  open,
  onOpenChange,
}: {
  workerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: worker, isLoading } = useWorker(workerId);
  const suspendMut = useSuspendWorker();
  const revokeMut = useRevokeWorkerVerification();

  const handleSuspend = async () => {
    if (!worker) return;
    const isActive = !worker.isActive;
    try {
      await suspendMut.mutateAsync({ id: worker.id, isActive });
      toast.success(isActive ? "Worker activated" : "Worker suspended");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleRevoke = async () => {
    if (!worker) return;
    try {
      await revokeMut.mutateAsync(worker.id);
      toast.success("Verification revoked. Documents moved to pending.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to revoke verification");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Worker Profile</DialogTitle>
          <DialogDescription>Full details and documents for this workforce member.</DialogDescription>
        </DialogHeader>
        {isLoading || !worker ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                {worker.user?.profileImageUrl ? (
                  <img
                    src={worker.user.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-slate-400">
                    {worker.user?.name?.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {worker.user?.name || "Unknown"}
                  {!worker.isActive && <Badge variant="destructive">Suspended</Badge>}
                </h3>
                <p className="text-sm text-muted-foreground">{worker.user?.phone}</p>
                <p className="text-xs text-muted-foreground">{worker.user?.email || "No email"}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={worker.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={handleSuspend}
                  disabled={suspendMut.isPending}
                >
                  {worker.isActive ? (
                    <>
                      <Ban className="w-4 h-4 mr-1" /> Suspend
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" /> Activate
                    </>
                  )}
                </Button>
                {worker.isDocVerified && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                    onClick={handleRevoke}
                    disabled={revokeMut.isPending}
                  >
                    <ShieldOff className="w-4 h-4 mr-1" /> Revoke Verification
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/40 border">
              <div>
                <span className="text-xs text-muted-foreground">Work Status</span>
                <div className="mt-1">
                  <StatusBadge status={worker.status} />
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Document Status</span>
                <div className="mt-1">
                  {worker.isDocVerified ? (
                    <Badge variant="outline" className="text-success border-success/40">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning border-warning/40">
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Bank Account</span>
                <div className="mt-1">
                  {worker.bankVerified ? (
                    <Badge variant="outline" className="text-success border-success/40">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning border-warning/40">
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Completed Jobs</span>
                <div className="font-semibold text-lg">{worker._count?.jobAssignments || 0}</div>
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Uploaded Documents</h4>
              {worker.documents?.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 bg-muted/20 border border-dashed rounded-lg text-center">
                  No documents uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {worker.documents?.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-3 flex items-start gap-3 bg-card"
                    >
                      <div className="p-2 rounded bg-muted">
                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{doc.type}</span>
                          <Badge
                            variant="outline"
                            className={
                              doc.status === "VERIFIED"
                                ? "text-success border-success/40"
                                : doc.status === "REJECTED"
                                ? "text-destructive border-destructive/40"
                                : "text-info border-info/40"
                            }
                          >
                            {doc.status}
                          </Badge>
                        </div>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-info hover:underline mt-1 inline-block"
                          >
                            View Document &rarr;
                          </a>
                        )}
                        {doc.rejectedReason && (
                          <p className="text-xs text-destructive mt-1">
                            Reason: {doc.rejectedReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
