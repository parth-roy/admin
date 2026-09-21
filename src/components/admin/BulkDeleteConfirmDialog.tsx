import { useState } from "react";
import { AlertTriangle, Trash2, Loader2, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string; // e.g. "Drivers", "Customers", "Workforce", "Fleet Owners", "Fleet Trucks"
  selectedCount: number;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function BulkDeleteConfirmDialog({
  open,
  onOpenChange,
  entityLabel,
  selectedCount,
  onConfirm,
  isLoading = false,
}: BulkDeleteConfirmDialogProps) {
  const [reason, setReason] = useState("Bulk administrative cleanup");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading || isLoading) return;
    setReason("Bulk administrative cleanup");
    setConfirmText("");
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (confirmText.trim() !== "DELETE") return;
    setLoading(true);
    try {
      await onConfirm(reason.trim() || "Bulk administrative cleanup");
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || isLoading;
  const isConfirmed = confirmText.trim() === "DELETE";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-destructive/30 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 text-destructive mb-1">
            <div className="p-2.5 rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-destructive">
                Permanently Delete {selectedCount.toLocaleString("en-IN")} {entityLabel}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Irreversible database operation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* High-visibility Warning Banner */}
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1.5 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-200">
            <div className="flex items-center gap-2 font-bold text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>These data will be gone forever!</span>
            </div>
            <p className="text-xs text-red-800/90 dark:text-red-300/90 leading-relaxed">
              This action is <strong>permanent and cannot be undone</strong>. All selected records, along with their linked profile data, documents, wallets, earnings, and related history, will be completely erased from the database.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Deletion <span className="text-muted-foreground font-normal">(Audit Log)</span>
            </Label>
            <Textarea
              rows={2}
              placeholder="e.g. Bulk removal of inactive or duplicate accounts"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none text-xs"
              disabled={isBusy}
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Type <span className="font-mono font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">DELETE</span> to confirm:
            </Label>
            <Input
              placeholder="Type DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="font-mono text-sm tracking-wider uppercase border-destructive/40 focus-visible:ring-destructive"
              disabled={isBusy}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isBusy}
            className="font-semibold gap-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Permanently Delete ({selectedCount})</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
