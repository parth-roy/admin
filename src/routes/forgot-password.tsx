import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authApi } from "@/lib/api/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — Parther Admin" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Something went wrong. Try again.");
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
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-sm text-zinc-500">We'll send a reset link to your Zoho email</p>
        </div>

        <Card className="bg-[#1a1d2e]/80 border-white/10 backdrop-blur shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white font-semibold">
              {sent ? "Email sent!" : "Forgot your password?"}
            </CardTitle>
            <CardDescription className="text-zinc-500">
              {sent
                ? "Check your inbox — the link expires in 1 hour."
                : "Enter your admin email address below."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>If <strong>{email}</strong> is registered, a reset link has been sent via Zoho Mail.</span>
                </div>
                <p className="text-xs text-zinc-500 text-center">
                  Didn't receive it? Check your spam folder, or{" "}
                  <button onClick={() => { setSent(false); setEmail(""); }} className="text-[#f4a31b] hover:underline">
                    try again
                  </button>.
                </p>
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
                  <Label htmlFor="email" className="text-zinc-300 text-xs font-medium uppercase tracking-wider">
                    Admin email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@gomytruck.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full bg-[#f4a31b] hover:bg-[#f4a31b]/90 text-[#0f1117] font-semibold"
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</> : "Send reset link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
