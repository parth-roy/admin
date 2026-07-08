import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useBroadcastNotification } from "@/hooks/usePlatform";

export const Route = createFileRoute("/platform/notifications")({
  head: () => ({ meta: [{ title: "Broadcast Notifications — Parther Admin" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [sent, setSent] = useState<{ title: string; audience: string; at: Date } | null>(null);

  const broadcastMut = useBroadcastNotification();

  const handleSend = async () => {
    if (!title || !body) return;
    try {
      await broadcastMut.mutateAsync({ title, body, target: audience as any, type: "SYSTEM" });
      setSent({ title, audience, at: new Date() });
      toast.success("Notification broadcast sent!");
      setTitle("");
      setBody("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Broadcast failed");
    }
  };

  const AUDIENCE_OPTIONS = [
    { value: "ALL", label: "All users" },
    { value: "DRIVER", label: "Drivers only" },
    { value: "CUSTOMER", label: "Customers only" },
    { value: "FLEET_OWNER", label: "Fleet owners only" },
  ];

  const estimatedCount: Record<string, string> = {
    ALL: "All registered users",
    DRIVER: "All active drivers",
    CUSTOMER: "All customers",
    FLEET_OWNER: "All fleet owners",
  };

  return (
    <div>
      <PageHeader
        title="Broadcast Notifications"
        description="Send push notifications to user segments."
      />
      <div className="p-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Compose */}
        <Card>
          <CardHeader><CardTitle className="text-base">Compose broadcast</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Recipients: {estimatedCount[audience]}</p>
            </div>
            <div>
              <Label>Title *</Label>
              <Input placeholder="Notification title…" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Message body *</Label>
              <Textarea placeholder="Notification message…" rows={4} value={body} onChange={e => setBody(e.target.value)} />
            </div>
            <Button
              className="w-full"
              disabled={!title || !body || broadcastMut.isPending}
              onClick={handleSend}
            >
              {broadcastMut.isPending
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <Send className="h-4 w-4 mr-2" />}
              Send to {AUDIENCE_OPTIONS.find(o => o.value === audience)?.label}
            </Button>
          </CardContent>
        </Card>

        {/* Preview / Status */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Notification preview</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-muted/30 p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-primary-foreground text-xs font-bold">G</div>
                  <div>
                    <p className="text-xs font-medium">{title || "Notification title"}</p>
                    <p className="text-[10px] text-muted-foreground">GoMyTruck Admin · Now</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-10">{body || "Notification message body…"}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{audience}</Badge>
                <Badge variant="outline">{body.length} / 256 chars</Badge>
              </div>
            </CardContent>
          </Card>

          {sent && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-sm font-medium">Last broadcast sent</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  "{sent.title}" to {sent.audience} · {sent.at.toLocaleTimeString("en-IN")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
