import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
} from "@/hooks/usePlatform";

export const Route = createFileRoute("/platform/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Parther Admin" }] }),
  component: AnnouncementsPage,
});

type FormState = { title: string; body: string; targetRole: string; expiresAt: string };
const INIT: FormState = { title: "", body: "", targetRole: "ALL", expiresAt: "" };

function AnnouncementsPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INIT);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: announcements, isLoading } = useAnnouncements();
  const createMut = useCreateAnnouncement();
  const updateMut = useUpdateAnnouncement();
  const deleteMut = useDeleteAnnouncement();

  const isEditing = !!editId;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });

  const openCreate = () => { setEditId(null); setForm(INIT); setOpen(true); };
  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({ title: a.title, body: a.body, targetRole: a.targetRole ?? "ALL", expiresAt: a.endsAt?.slice(0, 10) ?? "" });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      title: form.title,
      body: form.body,
      targetRole: form.targetRole,
      isActive: true,
      imageUrl: null,
      linkUrl: null,
      startsAt: null,
      endsAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    try {
      if (isEditing) {
        await updateMut.mutateAsync({ id: editId!, data: payload });
        toast.success("Announcement updated");
      } else {
        await createMut.mutateAsync(payload as any);
        toast.success("Announcement created");
      }
      setOpen(false);
      setForm(INIT);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Action failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success("Announcement deleted");
      setDeleteId(null);
    } catch { toast.error("Delete failed"); }
  };

  const TARGET_COLORS: Record<string, string> = {
    ALL: "text-primary border-primary/40",
    DRIVER: "text-info border-info/40",
    CUSTOMER: "text-success border-success/40",
    FLEET_OWNER: "text-warning-foreground border-warning/40",
  };

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Broadcast in-app announcements to users."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />New announcement
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
        ) : (announcements as any[])?.length ? (
          (announcements as any[]).map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="flex gap-3">
                  <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-primary/10">
                    <Megaphone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{a.title}</p>
                      <Badge variant="outline" className={TARGET_COLORS[a.targetRole] ?? ""}>{a.targetRole}</Badge>
                      {a.endsAt && new Date(a.endsAt) < new Date() && (
                        <Badge variant="outline" className="text-destructive border-destructive/40">Expired</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {fmtDate(a.createdAt)}
                      {a.endsAt && ` · Expires: ${fmtDate(a.endsAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-16 text-center text-muted-foreground">No announcements yet</div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label>
              <Input placeholder="e.g. New feature update" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div><Label>Content *</Label>
              <Textarea placeholder="Announcement message…" rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </div>
            <div><Label>Target audience</Label>
              <Select value={form.targetRole} onValueChange={v => setForm(f => ({ ...f, targetRole: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All users</SelectItem>
                  <SelectItem value="DRIVER">Drivers only</SelectItem>
                  <SelectItem value="CUSTOMER">Customers only</SelectItem>
                  <SelectItem value="FLEET_OWNER">Fleet owners only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ends at (optional)</Label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.title || !form.body || createMut.isPending || updateMut.isPending} onClick={handleSubmit}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEditing ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete announcement?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={handleDelete}>
              {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
