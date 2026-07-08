import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trophy, Star, ShieldCheck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useBadges, useGamificationStats, useCreateBadge, useUpdateBadge,
} from "@/hooks/useGamification";

export const Route = createFileRoute("/platform/gamification")({
  head: () => ({ meta: [{ title: "Gamification & Badges — Parther Admin" }] }),
  component: GamificationPage,
});

type FormState = {
  code: string;
  name: string;
  description: string;
  icon: string;
  metric: string;
  targetValue: number;
  tier: string;
};

const INIT_FORM: FormState = {
  code: "",
  name: "",
  description: "",
  icon: "Icons.star",
  metric: "TOTAL_JOBS",
  targetValue: 10,
  tier: "BRONZE",
};

function GamificationPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INIT_FORM);

  const { data: stats, isLoading: loadingStats } = useGamificationStats();
  const { data: badges, isLoading: loadingBadges } = useBadges();
  
  const createMut = useCreateBadge();
  const updateMut = useUpdateBadge();

  const isEditing = !!editId;

  const openCreate = () => {
    setEditId(null);
    setForm(INIT_FORM);
    setOpen(true);
  };

  const openEdit = (b: any) => {
    setEditId(b.id);
    setForm({
      code: b.code,
      name: b.name,
      description: b.description,
      icon: b.icon,
      metric: b.metric,
      targetValue: b.targetValue,
      tier: b.tier,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await updateMut.mutateAsync({ id: editId!, data: form });
        toast.success("Badge updated");
      } else {
        await createMut.mutateAsync(form);
        toast.success("Badge created");
      }
      setOpen(false);
      setForm(INIT_FORM);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Action failed");
    }
  };

  const tierColors: Record<string, string> = {
    BRONZE: "bg-orange-600/10 text-orange-600 border-orange-600/20",
    SILVER: "bg-slate-400/10 text-slate-500 border-slate-400/20",
    GOLD: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    PLATINUM: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    DIAMOND: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  return (
    <div>
      <PageHeader
        title="Gamification & Badges"
        description="Manage workforce gamification rules, badges, and view tier distributions."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Create Badge
          </Button>
        }
      />
      
      <div className="p-6 space-y-6">
        
        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tier Distribution Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                Workforce Tier Distribution
              </CardTitle>
              <CardDescription>Number of workers currently at each gamification tier.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-2 mt-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {stats?.tierDistribution?.length ? stats.tierDistribution.map((t: any) => (
                    <div key={t.tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={tierColors[t.tier] ?? ""}>{t.tier}</Badge>
                      </div>
                      <span className="font-semibold text-sm">{t.count} workers</span>
                    </div>
                  )) : (
                    <div className="text-sm text-muted-foreground text-center py-4">No data available</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Earned Badges Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                Most Unlocked Badges
              </CardTitle>
              <CardDescription>Badges that have been unlocked by the most workers.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-2 mt-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {stats?.topEarnedBadges?.length ? stats.topEarnedBadges.map((b: any, index: number) => (
                    <div key={b.code} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{b.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{b.count} unlocks</span>
                    </div>
                  )) : (
                    <div className="text-sm text-muted-foreground text-center py-4">No data available</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Badges Table */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Badges</CardTitle>
            <CardDescription>List of all badges and their target thresholds.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBadges ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="h-10 px-4 text-left font-medium">Badge</th>
                      <th className="h-10 px-4 text-left font-medium">Metric</th>
                      <th className="h-10 px-4 text-left font-medium">Target</th>
                      <th className="h-10 px-4 text-left font-medium">Tier</th>
                      <th className="h-10 px-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(badges as any[])?.length ? (
                      (badges as any[]).map((b) => (
                        <tr key={b.id} className="border-t hover:bg-muted/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary">
                                <Star className="h-5 w-5 text-yellow-500" />
                              </div>
                              <div>
                                <p className="font-medium">{b.name}</p>
                                <p className="text-xs text-muted-foreground">{b.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs">{b.metric}</td>
                          <td className="p-4 font-semibold">{b.targetValue}</td>
                          <td className="p-4">
                            <Badge variant="outline" className={tierColors[b.tier] ?? ""}>{b.tier}</Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(b)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No badges found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Badge" : "Create Badge"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Badge Name</Label>
              <Input placeholder="e.g. Century Club" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Completed 100 jobs" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Code (Unique)</Label>
              <Input placeholder="e.g. century_club" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} disabled={isEditing} />
            </div>
            <div className="space-y-2">
              <Label>Icon String</Label>
              <Input placeholder="e.g. Icons.star" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Evaluation Metric</Label>
              <Select value={form.metric} onValueChange={v => setForm({ ...form, metric: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOTAL_JOBS">Total Jobs</SelectItem>
                  <SelectItem value="RATING">Rating</SelectItem>
                  <SelectItem value="ACCEPTANCE_RATE">Acceptance Rate</SelectItem>
                  <SelectItem value="ON_TIME_RATE">On-Time Rate</SelectItem>
                  <SelectItem value="TOTAL_EARNINGS">Total Earnings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Value</Label>
              <Input type="number" placeholder="100" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: Number(e.target.value) })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Tier Assignment</Label>
              <Select value={form.tier} onValueChange={v => setForm({ ...form, tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRONZE">Bronze</SelectItem>
                  <SelectItem value="SILVER">Silver</SelectItem>
                  <SelectItem value="GOLD">Gold</SelectItem>
                  <SelectItem value="PLATINUM">Platinum</SelectItem>
                  <SelectItem value="DIAMOND">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.name || !form.code || createMut.isPending || updateMut.isPending} onClick={handleSubmit}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
