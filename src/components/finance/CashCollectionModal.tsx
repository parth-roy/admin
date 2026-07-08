import { useState } from "react";
import { useCollectCash } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type TargetType = "driver" | "fleet" | "worker";

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }
  return "Failed to collect cash";
}

export function CashCollectionModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<TargetType>("driver");
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const collectCash = useCollectCash();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !amount) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      entityType: targetType.toUpperCase() as "DRIVER" | "FLEET" | "WORKER",
      entityId: targetId,
      amount: parseFloat(amount),
      note: remarks || "Manual cash collection",
    };

    collectCash.mutate(payload, {
      onSuccess: () => {
        toast.success("Cash collected successfully");
        setOpen(false);
        setTargetId("");
        setAmount("");
        setRemarks("");
      },
      onError: (err: unknown) => {
        toast.error(getErrorMessage(err));
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Collect Cash</DialogTitle>
          <DialogDescription>
            Record manual cash collection from a driver, fleet owner, or workforce member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>User Type</Label>
            <Select
              value={targetType}
              onValueChange={(value) => setTargetType(value as TargetType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="fleet">Fleet Owner</SelectItem>
                <SelectItem value="worker">Workforce</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetId">ID (Driver/Fleet/Worker)</Label>
            <Input
              id="targetId"
              placeholder="Enter User ID or Phone"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Make sure you enter the exact UUID.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              placeholder="Optional remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={collectCash.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={collectCash.isPending}>
              {collectCash.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Collect Cash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
