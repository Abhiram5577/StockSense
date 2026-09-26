import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { authApi } from "../lib/api";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — StockSense" },
      { name: "description", content: "Set a new password for your StockSense account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetToken.trim()) {
      setErrorMessage("Reset authorization token is required. If you don't have one, please verify your OTP first.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.resetPassword({
        resetToken: resetToken.trim(),
        newPassword,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 transition-transform hover:scale-105">
            <span className="grid size-9 place-items-center rounded-lg bg-primary font-display text-base font-bold text-primary-foreground shadow-panel">
              S
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              StockSense
            </span>
          </Link>
          <h1 className="mt-4 font-display text-xl font-semibold tracking-tight text-foreground">
            Create new password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your reset token and your new password
          </p>
        </div>

        <div className="rise rounded-2xl bg-panel/70 p-6 sm:p-8 shadow-panel ring-1 ring-border/60 backdrop-blur-2xl">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive">
              <AlertCircle className="size-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/20 text-primary">
                <CheckCircle2 className="size-7" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Password Reset Successfully
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can now log in using your new credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-sm text-primary-foreground shadow-panel transition-all hover:bg-primary/90"
              >
                Sign in with new password
                <ArrowRight className="size-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Reset Authorization Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste reset token from OTP verification"
                  className="h-10 w-full rounded-lg bg-panel-strong/80 px-3 text-sm text-foreground outline-none ring-1 ring-border/60 transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary"
                />
                <p className="mt-1 text-right">
                  <Link to="/forgot-password" className="font-mono text-[11px] text-primary hover:underline">
                    Need an OTP first?
                  </Link>
                </p>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-10 w-full rounded-lg bg-panel-strong/80 pl-10 pr-10 text-sm text-foreground outline-none ring-1 ring-border/60 transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="h-10 w-full rounded-lg bg-panel-strong/80 pl-10 pr-3 text-sm text-foreground outline-none ring-1 ring-border/60 transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-sm text-primary-foreground shadow-panel transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  <>
                    Reset password
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
