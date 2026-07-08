import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const map: Record<string, string> = {
  // booking
  DRAFT: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-info/15 text-info border-info/30",
  DRIVER_ASSIGNED: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  DRIVER_ARRIVING: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  PICKED_UP: "bg-warning/20 text-warning-foreground border-warning/40",
  IN_TRANSIT: "bg-warning/20 text-warning-foreground border-warning/40",
  DELIVERED: "bg-success/15 text-success border-success/30",
  COMPLETED: "bg-success/15 text-success border-success/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
  // generic
  PENDING: "bg-warning/20 text-warning-foreground border-warning/40",
  VERIFIED: "bg-success/15 text-success border-success/30",
  FAILED: "bg-destructive/10 text-destructive border-destructive/30",
  MANUAL_REVIEW: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  PAID: "bg-success/15 text-success border-success/30",
  REFUNDED: "bg-muted text-muted-foreground",
  // driver
  AVAILABLE: "bg-success/15 text-success border-success/30",
  ON_TRIP: "bg-warning/20 text-warning-foreground border-warning/40",
  OFFLINE: "bg-muted text-muted-foreground",
  BREAK: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  // plan
  BASIC: "bg-muted text-muted-foreground",
  STANDARD: "bg-info/15 text-info border-info/30",
  PRO: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  PREMIUM: "bg-warning/20 text-warning-foreground border-warning/40",
  // ticket
  OPEN: "bg-info/15 text-info border-info/30",
  IN_PROGRESS: "bg-warning/20 text-warning-foreground border-warning/40",
  RESOLVED: "bg-success/15 text-success border-success/30",
  CLOSED: "bg-muted text-muted-foreground",
  // docs
  VALID: "bg-success/15 text-success border-success/30",
  EXPIRING: "bg-warning/20 text-warning-foreground border-warning/40",
  EXPIRED: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) {
    return (
      <Badge variant="outline" className="font-medium uppercase tracking-wide text-[10px] border bg-muted text-muted-foreground">
        N/A
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium uppercase tracking-wide text-[10px] border",
        map[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
