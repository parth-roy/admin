import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts, useLocation,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/auth";
import { Loader2 } from "lucide-react";

// ── Auth routes that bypass the sidebar shell ─────────────────────────────────
const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password"];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing the page.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Parther Admin — gomytruck.com" },
      { name: "description", content: "Operations, finance, fleet and support admin panel for Parther Logistics." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const isAuthRoute = AUTH_ROUTES.some(r => location.pathname.startsWith(r));

  // Show full-screen spinner while checking token on mount
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#f4a31b] mx-auto" />
          <p className="text-sm text-zinc-500">Verifying session…</p>
        </div>
      </div>
    );
  }

  // Auth routes: render without sidebar (login, forgot-password, reset-password)
  if (isAuthRoute) {
    return <Outlet />;
  }

  // Protected routes: redirect to login if not authenticated
  if (!isAuthenticated) {
    // Perform a client-side redirect to login
    window.location.replace(`/login?redirect=${encodeURIComponent(location.pathname)}`);
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f4a31b]" />
      </div>
    );
  }

  // Authenticated — show admin shell with sidebar
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col min-w-0">
          <AdminTopbar />
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <Toaster position="top-right" />
    </SidebarProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
