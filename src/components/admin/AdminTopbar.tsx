import type { ReactNode } from "react";
import { Bell, Search, Truck, Users, Globe } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminWorkspace } from "@/contexts/workspace";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b bg-card/40 px-6 py-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AdminTopbar() {
  const { mode, config } = useAdminWorkspace();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search bookings, drivers, users…"
          className="h-9 pl-9 bg-muted/40 border-transparent focus-visible:bg-background"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        {/* Workspace Division Indicator */}
        <Badge
          variant="outline"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-muted/40"
        >
          {mode === "gomytruck" ? (
            <Truck className="h-3.5 w-3.5 text-emerald-500" />
          ) : mode === "metromitra" ? (
            <Users className="h-3.5 w-3.5 text-violet-500" />
          ) : (
            <Globe className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span>{config.title}</span>
        </Badge>

        <Badge variant="outline" className="hidden md:inline-flex gap-1.5 border-success/30 text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Live
        </Badge>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </div>
    </header>
  );
}
