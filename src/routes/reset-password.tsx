import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { authApi } from "@/lib/api/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/reset-password")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Reset Password — Parther Admin" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate({ to: "/login" }), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Reset failed. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#f4a31b]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f4a31b]/15 border border-[#f4a31b]/30 mb-2">
            <span className="text-3xl font-black text-[#f4a31b]">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
        </div>

        <Card className="bg-[#1a1d2e]/80 border-white/10 backdrop-blur shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white font-semibold">
              {success ? "Password updated!" : "Choose a strong password"}
            </CardTitle>
            <CardDescription className="text-zinc-500">
              {success
                ? "Redirecting you to login in 3 seconds…"
                : "Min 8 characters, one uppercase, one number."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Password reset successfully. Please log in with your new password.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-xs font-medium uppercase tracking-wider">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={8}
                      className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-xs font-medium uppercase tracking-wider">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full bg-[#f4a31b] hover:bg-[#f4a31b]/90 text-[#0f1117] font-semibold"
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Resetting…</> : "Reset password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
