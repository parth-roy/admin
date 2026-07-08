import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Lock, Mail, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Parther Admin" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate({ to: "/" });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Login failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#f4a31b]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Logo & Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f4a31b]/15 border border-[#f4a31b]/30 mb-2">
            <span className="text-3xl font-black text-[#f4a31b]">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Parther Admin</h1>
          <p className="text-sm text-zinc-500">Operations & Management Dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="bg-[#1a1d2e]/80 border-white/10 backdrop-blur shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white font-semibold">Sign in to continue</CardTitle>
            <CardDescription className="text-zinc-500">
              Admin access only. All sessions are logged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-300 text-xs font-medium uppercase tracking-wider">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@gomytruck.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-[#f4a31b]/50 focus:ring-[#f4a31b]/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-300 text-xs font-medium uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-[#f4a31b]/50 focus:ring-[#f4a31b]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#f4a31b]/80 hover:text-[#f4a31b] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full bg-[#f4a31b] hover:bg-[#f4a31b]/90 text-[#0f1117] font-semibold py-2.5 transition-all"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Signing in…</>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} Parther Technologies Pvt Ltd &nbsp;·&nbsp; CIN: U62099WR2026PTC293183
        </p>
      </div>
    </div>
  );
}
