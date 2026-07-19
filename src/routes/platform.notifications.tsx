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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

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
    <div className="flex flex-col h-full">
      <PageHeader
        title="Notifications & Messages"
        description="Send push broadcasts and view public contact messages."
      />
      
      <div className="px-6 pt-4 pb-0 border-b">
        <Tabs defaultValue="broadcast" className="w-full">
          <TabsList className="mb-[-1px] bg-transparent p-0 border-b-0 space-x-6">
            <TabsTrigger 
              value="broadcast" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 pt-2 px-1"
            >
              Push Broadcasts
            </TabsTrigger>
            <TabsTrigger 
              value="contact" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 pt-2 px-1"
            >
              Public Form Messages
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="broadcast" className="mt-0 py-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
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
          </TabsContent>

          <TabsContent value="contact" className="mt-0 py-6">
            <ContactMessagesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ContactMessagesTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/contact-messages");
      return res.data?.data || [];
    }
  });

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/admin/contact-messages/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      toast.success("Message status updated");
    },
    onError: () => toast.error("Failed to update status")
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground h-6 w-6" /></div>;
  }

  if (!data?.length) {
    return <div className="p-8 text-center text-muted-foreground">No contact messages yet.</div>;
  }

  return (
    <div className="grid gap-4">
      {data.map((msg: any) => (
        <Card key={msg.id} className={msg.status === "UNREAD" ? "border-l-4 border-l-blue-500" : ""}>
          <CardHeader className="py-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">{msg.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{msg.phone} · {formatDistanceToNow(new Date(msg.createdAt))} ago</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={msg.status === "UNREAD" ? "default" : msg.status === "RESOLVED" ? "secondary" : "outline"}>
                  {msg.status}
                </Badge>
                {msg.status !== "RESOLVED" && (
                  <Select
                    value={msg.status}
                    onValueChange={(val) => updateStatusMut.mutate({ id: msg.id, status: val })}
                  >
                    <SelectTrigger className="h-7 text-xs w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNREAD">Mark Unread</SelectItem>
                      <SelectItem value="READ">Mark Read</SelectItem>
                      <SelectItem value="RESOLVED">Mark Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap">
              {msg.message}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
