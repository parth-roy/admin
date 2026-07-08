import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Map, Users, ShieldCheck, Package, ClipboardList,
  Radio, Truck, Building2, Wallet, BadgeIndianRupee, Receipt, FileText,
  LifeBuoy, Settings, Megaphone, Bell, FileCheck2, CalendarClock,
  ScrollText, BarChart3, ChevronRight, Boxes, LogOut, Banknote, GraduationCap
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";

const sections = [
  {
    label: "Dashboard",
    items: [
      { title: "Overview", url: "/", icon: LayoutDashboard },
      { title: "Live Operations Map", url: "/live-map", icon: Map },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "All Bookings", url: "/bookings", icon: ClipboardList },
      { title: "Dispatch Queue", url: "/dispatch", icon: Radio },
      { title: "Driver Verification", url: "/verification", icon: ShieldCheck },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Drivers", url: "/drivers", icon: Package },
      { title: "Workforce", url: "/workforce", icon: Users },
      { title: "Fleet Owners", url: "/fleet/owners", icon: Building2 },
      { title: "Fleet Trucks", url: "/fleet/trucks", icon: Truck },
      { title: "Truck Compliance", url: "/fleet/compliance", icon: FileCheck2 },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Revenue", url: "/finance/revenue", icon: BadgeIndianRupee },
      { title: "Earnings & Payouts", url: "/finance/earnings", icon: Wallet },
      { title: "Subscriptions", url: "/finance/subscriptions", icon: Receipt },
      { title: "Wallets", url: "/finance/wallets", icon: Boxes },
      { title: "Withdrawals", url: "/finance/withdrawals", icon: Banknote },
      { title: "Refunds", url: "/finance/refunds", icon: FileText },
    ],
  },
  {
    label: "Support",
    items: [{ title: "Tickets", url: "/support", icon: LifeBuoy }],
  },
  {
    label: "Platform",
    items: [
      { title: "Pricing Config", url: "/platform/pricing", icon: Settings },
      { title: "Announcements", url: "/platform/announcements", icon: Megaphone },
      { title: "Workforce Announcements", url: "/platform/workforce-announcements", icon: Megaphone },
      { title: "Notifications", url: "/platform/notifications", icon: Bell },
      { title: "Gamification", url: "/platform/gamification", icon: ShieldCheck },
      { title: "Training", url: "/platform/training", icon: GraduationCap },
    ],
  },
  {
    label: "Compliance & Audit",
    items: [
      { title: "Compliance Monitor", url: "/compliance", icon: ShieldCheck },
      { title: "ULIP Logs", url: "/compliance/ulip", icon: ScrollText },
      { title: "Document Expiry", url: "/compliance/expiry", icon: CalendarClock },
    ],
  },
  {
    label: "Reports",
    items: [{ title: "Business Reports", url: "/reports", icon: BarChart3 }],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { admin, logout } = useAuth();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  const initials = admin?.name
    ? admin.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "SA";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg">
            P
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-semibold text-sidebar-foreground">
              Parther Admin
            </span>
            <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              gomytruck.com
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {isActive(item.url) && (
                          <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />
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

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium text-sidebar-foreground truncate">
              {admin?.name ?? "Super Admin"}
            </span>
            <span className="text-[10px] text-sidebar-foreground/60 truncate">
              {admin?.email ?? "admin@gomytruck.com"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0 text-sidebar-foreground/60 hover:text-destructive group-data-[collapsible=icon]:hidden"
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
