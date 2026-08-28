import { useState } from "react";
import { AlertTriangle, Trash2, ShieldOff, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  entityName: string;
  onSoftDelete: (reason: string) => Promise<void>;
  onHardDelete: (reason: string) => Promise<void>;
  softDeleteLabel?: string;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  entityLabel,
  entityName,
  onSoftDelete,
  onHardDelete,
  softDeleteLabel = "Deactivate Account",
  isLoading = false,
}: DeleteConfirmDialogProps) {
  const [mode, setMode] = useState<"choose" | "soft" | "hard">("choose");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setMode("choose");
    setReason("");
    setConfirmText("");
    onOpenChange(false);
  };

  const handleSoft = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onSoftDelete(reason.trim());
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleHard = async () => {
    if (!reason.trim() || confirmText !== "DELETE") return;
    setLoading(true);
    try {
      await onHardDelete(reason.trim());
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || isLoading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {mode === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete {entityLabel}
              </DialogTitle>
              <DialogDescription>
                <span className="font-semibold text-foreground">{entityName}</span>
                {" "}&mdash; Choose how to remove this {entityLabel.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <button
                className="w-full text-left rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 hover:bg-amber-500/10 transition-colors"
                onClick={() => setMode("soft")}
              >
                <div className="flex items-start gap-3">
                  <ShieldOff className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">
                      {softDeleteLabel} (Recommended)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deactivates the account and revokes all active sessions. Data is preserved.
                      The account can be reactivated later.
                    </p>
                  </div>
                </div>
              </button>
              <button
                className="w-full text-left rounded-lg border border-destructive/40 bg-destructive/5 p-4 hover:bg-destructive/10 transition-colors"
                onClick={() => setMode("hard")}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-destructive">Permanent Delete</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Irreversibly removes all data including profile, bookings, wallet,
                      and documents. Cannot be undone. Requires confirmation.
                    </p>
                  </div>
                </div>
              </button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </DialogFooter>
          </>
        )}
        {mode === "soft" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <ShieldOff className="h-5 w-5" />
                Deactivate {entityLabel}
              </DialogTitle>
              <DialogDescription>
                This will deactivate{" "}
                <span className="font-semibold text-foreground">{entityName}</span>
                &apos;s account and immediately revoke all active sessions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div>
                <Label className="text-sm">Reason <span className="text-destructive">*</span></Label>
                <Textarea
                  className="mt-1 resize-none"
                  rows={3}
                  placeholder="e.g. Violation of terms, fraud detected, user request..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setMode("choose")} disabled={isBusy}>Back</Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={handleSoft}
                disabled={!reason.trim() || isBusy}
              >
                {isBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Deactivate Account
              </Button>
            </DialogFooter>
          </>
        )}
        {mode === "hard" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Permanently Delete {entityLabel}
              </DialogTitle>
              <DialogDescription>
                This action <span className="font-bold">cannot be undone</span>. All data for{" "}
                <span className="font-semibold text-foreground">{entityName}</span>{" "}
                will be permanently erased.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div>
                <Label className="text-sm">Reason <span className="text-destructive">*</span></Label>
                <Textarea
                  className="mt-1 resize-none"
                  rows={2}
                  placeholder="State the specific reason for permanent deletion..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">
                  Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                </Label>
                <Input
                  className={cn("mt-1 font-mono", confirmText === "DELETE" && "border-destructive")}
                  placeholder="DELETE"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setMode("choose")} disabled={isBusy}>Back</Button>
              <Button
                variant="destructive"
                onClick={handleHard}
                disabled={!reason.trim() || confirmText !== "DELETE" || isBusy}
              >
                {isBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Permanently Delete
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
