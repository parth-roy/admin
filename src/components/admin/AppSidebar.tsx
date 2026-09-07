import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  Users,
  ShieldCheck,
  Package,
  ClipboardList,
  Radio,
  Truck,
  Building2,
  Wallet,
  BadgeIndianRupee,
  Receipt,
  FileText,
  LifeBuoy,
  Settings,
  Megaphone,
  Bell,
  FileCheck2,
  CalendarClock,
  ScrollText,
  BarChart3,
  ChevronRight,
  Boxes,
  LogOut,
  Banknote,
  GraduationCap,
  ChevronsUpDown,
  Check,
  CheckCircle2,
  Shield,
  Layers,
  CreditCard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useAdminWorkspace, type AdminWorkspaceMode } from "@/contexts/workspace";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useUnreadBookings } from "@/hooks/useUnreadBookings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  domain?: AdminWorkspaceMode;
}

interface MenuSection {
  label: string;
  domain?: AdminWorkspaceMode;
  items: MenuItem[];
}

const sections: MenuSection[] = [
  {
    label: "Dashboard",
    items: [
      { title: "Overview", url: "/", icon: LayoutDashboard, domain: "all" },
      { title: "Live Operations Map", url: "/live-map", icon: Map, domain: "gomytruck" },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "All Bookings", url: "/bookings", icon: ClipboardList, domain: "gomytruck" },
      { title: "Manual Bookings", url: "/manual-bookings", icon: Truck, domain: "gomytruck" },
      { title: "Workforce Bookings", url: "/workforce-bookings", icon: ClipboardList, domain: "metromitra" },
      { title: "Dispatch Queue", url: "/dispatch", icon: Radio, domain: "gomytruck" },
      { title: "Driver Verification", url: "/verification", icon: ShieldCheck, domain: "gomytruck" },
      { title: "Workforce Verification", url: "/workforce/verification", icon: FileCheck2, domain: "metromitra" },
    ],
  },
  {
    label: "People & Fleet",
    items: [
      { title: "Customers", url: "/customers", icon: Users, domain: "all" },
      { title: "Drivers", url: "/drivers", icon: Package, domain: "gomytruck" },
      { title: "Workforce", url: "/workforce", icon: Users, domain: "metromitra" },
      { title: "Fleet Owners", url: "/fleet/owners", icon: Building2, domain: "gomytruck" },
      { title: "Fleet Trucks", url: "/fleet/trucks", icon: Truck, domain: "gomytruck" },
      { title: "Truck Compliance", url: "/fleet/compliance", icon: FileCheck2, domain: "gomytruck" },
    ],
  },
  {
    label: "Finance & Accounts",
    items: [
      { title: "Revenue", url: "/finance/revenue", icon: BadgeIndianRupee, domain: "gomytruck" },
      { title: "Gateway Transactions", url: "/finance/transactions", icon: CreditCard, domain: "all" },
      { title: "Earnings & Payouts", url: "/finance/earnings", icon: Wallet, domain: "all" },
      { title: "Subscriptions", url: "/finance/subscriptions", icon: Receipt, domain: "gomytruck" },
      { title: "Wallets", url: "/finance/wallets", icon: Boxes, domain: "all" },
      { title: "Withdrawals", url: "/finance/withdrawals", icon: Banknote, domain: "all" },
      { title: "Refunds", url: "/finance/refunds", icon: FileText, domain: "gomytruck" },
    ],
  },
  {
    label: "Support",
    domain: "all",
    items: [{ title: "Tickets", url: "/support", icon: LifeBuoy, domain: "all" }],
  },
  {
    label: "Platform Management",
    items: [
      { title: "Pricing Config", url: "/platform/pricing", icon: Settings, domain: "all" },
      { title: "Announcements", url: "/platform/announcements", icon: Megaphone, domain: "gomytruck" },
      { title: "Workforce Announcements", url: "/platform/workforce-announcements", icon: Megaphone, domain: "metromitra" },
      { title: "Notifications", url: "/platform/notifications", icon: Bell, domain: "all" },
      { title: "Gamification", url: "/platform/gamification", icon: ShieldCheck, domain: "gomytruck" },
      { title: "Training", url: "/platform/training", icon: GraduationCap, domain: "all" },
      { title: "Form Gig Onboard Leads", url: "/platform/form-gig-onboard-leads", icon: ClipboardList, domain: "metromitra" },
      { title: "Direct Contact Approvals", url: "/platform/direct-contact-approvals", icon: CheckCircle2, domain: "metromitra" },
      { title: "Form Driver Leads", url: "/platform/form-driver-leads", icon: ClipboardList, domain: "gomytruck" },
    ],
  },
  {
    label: "Compliance & Audit",
    domain: "gomytruck",
    items: [
      { title: "Compliance Monitor", url: "/compliance", icon: ShieldCheck, domain: "gomytruck" },
      { title: "ULIP Logs", url: "/compliance/ulip", icon: ScrollText, domain: "gomytruck" },
      { title: "Document Expiry", url: "/compliance/expiry", icon: CalendarClock, domain: "gomytruck" },
    ],
  },
  {
    label: "Reports & Analytics",
    domain: "all",
    items: [{ title: "Business Reports", url: "/reports", icon: BarChart3, domain: "all" }],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { admin, logout } = useAuth();
  const { mode, setMode, config } = useAdminWorkspace();

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    // Exact-prefix but must be followed by end-of-string or "/" to avoid
    // /workforce matching /workforce/verification
    return pathname === url || pathname.startsWith(url + "/");
  };

  const { data: pendingData } = useQuery({
    queryKey: ["pendingWorkerDocumentsCount"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/worker-documents/pending-count");
      return res.data;
    },
    refetchInterval: 30000,
  });
  const pendingCount = pendingData?.data?.count || 0;
  const { unreadCount: unreadBookingsCount } = useUnreadBookings();

  const initials = admin?.name
    ? admin.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SA";

  const filteredSections = sections
    .filter((section) => {
      if (mode === "all") return true;
      if (!section.domain || section.domain === "all") return true;
      return section.domain === mode;
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (mode === "all") return true;
        if (!item.domain || item.domain === "all") return true;
        return item.domain === mode;
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      {/* Clean Formal Industry-Standard Workspace Header */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center justify-between gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left outline-none group focus-visible:ring-2 focus-visible:ring-primary/50 shadow-xs"
              title="Click to switch workspace division"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border transition-all shadow-xs",
                    config.iconBg
                  )}
                >
                  {mode === "gomytruck" ? (
                    <Truck className="h-5 w-5 text-emerald-400" />
                  ) : mode === "metromitra" ? (
                    <Users className="h-5 w-5 text-indigo-400" />
                  ) : (
                    <Layers className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-semibold text-white tracking-tight truncate">
                    {config.title}
                  </span>
                  <span className="text-xs text-slate-400 truncate mt-0.5">
                    {config.domain}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors shrink-0 group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="w-72 p-2 bg-[#0b0f19] border border-slate-800 text-slate-100 shadow-2xl z-50 rounded-xl space-y-1"
          >
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 py-1.5">
              Switch Division
            </DropdownMenuLabel>

            {/* GoMyTruck Option */}
            <DropdownMenuItem
              onClick={() => {
                setMode("gomytruck");
                toast.success("Switched to GoMyTruck (Logistics & Fleet)");
              }}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all",
                mode === "gomytruck"
                  ? "bg-emerald-500/20 text-white font-medium border border-emerald-500/40"
                  : "hover:bg-slate-800/80 text-slate-300"
              )}
            >
              <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Truck className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-400">GoMyTruck Admin</span>
                  {mode === "gomytruck" && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
                <p className="text-xs text-slate-400 truncate">gomytruck.com • Freight & Fleet</p>
              </div>
            </DropdownMenuItem>

            {/* MetroMitra Option */}
            <DropdownMenuItem
              onClick={() => {
                setMode("metromitra");
                toast.success("Switched to MetroMitra (Workforce & Services)");
              }}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all",
                mode === "metromitra"
                  ? "bg-indigo-500/20 text-white font-medium border border-indigo-500/40"
                  : "hover:bg-slate-800/80 text-slate-300"
              )}
            >
              <div className="h-9 w-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Users className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-indigo-400">MetroMitra Admin</span>
                  {mode === "metromitra" && <Check className="h-4 w-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-slate-400 truncate">metromitra.com • Workforce & Gigs</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-slate-800 my-1" />

            {/* Super Admin Unified Option */}
            <DropdownMenuItem
              onClick={() => {
                setMode("all");
                toast.info("Switched to Super Admin (All Operations)");
              }}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all",
                mode === "all"
                  ? "bg-blue-500/20 text-white font-medium border border-blue-500/40"
                  : "hover:bg-slate-800/80 text-slate-300"
              )}
            >
              <div className="h-9 w-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Layers className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-400">Super Admin (All)</span>
                  {mode === "all" && <Check className="h-4 w-4 text-blue-400" />}
                </div>
                <p className="text-xs text-slate-400 truncate">Full access to all platform tools</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="no-scrollbar px-2 py-2 gap-2">
        {filteredSections.map((section) => (
          <SidebarGroup key={section.label} className="p-0">
            <SidebarGroupLabel className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 py-2">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-200 hover:text-white rounded-lg transition-colors">
                        <item.icon className="h-4.5 w-4.5 shrink-0" />
                        <span className="text-sm font-medium">{item.title}</span>
                        {item.url === "/workforce/verification" && pendingCount > 0 && (
                          <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white group-data-[collapsible=icon]:hidden shadow-xs">
                            {pendingCount}
                          </div>
                        )}
                        {item.url === "/bookings" && unreadBookingsCount > 0 && (
                          <div className="ml-auto flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white group-data-[collapsible=icon]:hidden shadow-xs animate-in fade-in zoom-in-75">
                            {unreadBookingsCount > 99 ? "99+" : unreadBookingsCount}
                          </div>
                        )}
                        {isActive(item.url) &&
                          !(item.url === "/workforce/verification" && pendingCount > 0) &&
                          !(item.url === "/bookings" && unreadBookingsCount > 0) && (
                            <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                          )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-1 py-1">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              {admin?.name ?? "Super Admin"}
            </span>
            <span className="text-xs text-sidebar-foreground/60 truncate">
              {admin?.email ?? "admin@gomytruck.com"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-sidebar-foreground/60 hover:text-destructive group-data-[collapsible=icon]:hidden rounded-lg"
            onClick={logout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
