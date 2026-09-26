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
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { authApi } from "../lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — StockSense" },
      { name: "description", content: "Register a new team account for StockSense inventory control desk." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Client-side password rule validations
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setErrorMessage("Password must be at least 8 characters long with both letters and numbers.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      if (res.success) {
        setSuccessMessage("Account created successfully! Redirecting to sign in...");
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 1500);
      } else {
        setErrorMessage(res.message || "Failed to create account.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to reach server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 selection:bg-primary selection:text-primary-foreground">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
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
            Create an account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up credentials for your warehouse workspace
          </p>
        </div>

        {/* Signup Card */}
        <div className="rise rounded-2xl bg-panel/70 p-6 sm:p-8 shadow-panel ring-1 ring-border/60 backdrop-blur-2xl">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive">
              <AlertCircle className="size-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 p-3.5 text-sm text-primary">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-10 w-full rounded-lg bg-panel-strong/80 pl-10 pr-3 text-sm text-foreground outline-none ring-1 ring-border/60 transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-10 w-full rounded-lg bg-panel-strong/80 pl-10 pr-3 text-sm text-foreground outline-none ring-1 ring-border/60 transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Role
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-10 w-full rounded-lg bg-panel-strong/80 pl-10 pr-3 text-sm text-foreground outline-none ring-1 ring-border/60 transition-all focus:ring-2 focus:ring-primary"
                >
                  <option value="staff">Staff (Warehouse Operator)</option>
                  <option value="manager">Manager (Inventory Supervisor)</option>
                  <option value="admin">Admin (System Administrator)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              {/* Password Requirement Badges */}
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono ${hasMinLength ? "bg-primary/20 text-primary" : "bg-panel-strong text-muted-foreground"}`}>
                  ✓ 8+ chars
                </span>
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono ${hasLetter ? "bg-primary/20 text-primary" : "bg-panel-strong text-muted-foreground"}`}>
                  ✓ Letter
                </span>
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono ${hasNumber ? "bg-primary/20 text-primary" : "bg-panel-strong text-muted-foreground"}`}>
                  ✓ Number
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className={`h-10 w-full rounded-lg bg-panel-strong/80 pl-10 pr-3 text-sm text-foreground outline-none ring-1 transition-all placeholder:text-muted-foreground/60 focus:ring-2 ${
                    confirmPassword && !passwordsMatch ? "ring-destructive focus:ring-destructive" : "ring-border/60 focus:ring-primary"
                  }`}
                />
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-sm text-primary-foreground shadow-panel transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Already have an account prompt */}
          <div className="mt-6 border-t border-border/50 pt-5 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
