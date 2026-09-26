import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RotateCcw,
} from "lucide-react";
import { authApi } from "../lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — StockSense" },
      { name: "description", content: "Recover your StockSense account via secure OTP verification." },
    ],
  }),
  component: ForgotPasswordPage,
});

type Step = "REQUEST_OTP" | "VERIFY_OTP" | "RESET_PASSWORD" | "SUCCESS";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("REQUEST_OTP");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // OTP Countdown timer (10 minutes = 600 seconds)
  const [countdown, setCountdown] = useState(600);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "VERIFY_OTP" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // STEP 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      if (res.success) {
        setStep("VERIFY_OTP");
        setCountdown(600);
        setCanResend(false);
        setInfoMessage(res.message || "An OTP has been dispatched to your email address.");
      } else {
        setErrorMessage(res.message || "Unable to process request.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend && countdown > 540) return; // cooldown
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      if (res.success) {
        setCountdown(600);
        setCanResend(false);
        setInfoMessage("A new OTP has been sent to your email.");
      } else {
        setErrorMessage(res.message || "Unable to resend OTP.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while resending OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP code.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.verifyOtp({ email: email.trim(), otp: cleanOtp });
      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        setStep("RESET_PASSWORD");
        setInfoMessage(null);
      } else {
        setErrorMessage(res.message || "Invalid or expired OTP.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error verifying OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetToken) {
      setErrorMessage("Reset session expired. Please start over.");
      setStep("REQUEST_OTP");
      return;
    }

    const hasMinLength = newPassword.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setErrorMessage("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.resetPassword({
        resetToken,
        newPassword,
      });

      if (res.success) {
        setStep("SUCCESS");
      } else {
        setErrorMessage(res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error resetting password.");
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
            {step === "REQUEST_OTP" && "Reset your password"}
            {step === "VERIFY_OTP" && "Enter verification OTP"}
            {step === "RESET_PASSWORD" && "Create new password"}
            {step === "SUCCESS" && "Password reset complete"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "REQUEST_OTP" && "We'll send a 6-digit one-time code to your registered email"}
            {step === "VERIFY_OTP" && `Check your email inbox (${email}) for the code`}
            {step === "RESET_PASSWORD" && "Choose a strong password with at least 8 characters"}
            {step === "SUCCESS" && "Your credentials have been securely updated"}
          </p>
        </div>

        {/* Card */}
        <div className="rise rounded-2xl bg-panel/70 p-6 sm:p-8 shadow-panel ring-1 ring-border/60 backdrop-blur-2xl">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive">
              <AlertCircle className="size-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 p-3.5 text-sm text-primary">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: Request OTP Form */}
          {step === "REQUEST_OTP" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Registered Email Address
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

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-sm text-primary-foreground shadow-panel transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP code
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" /> Back to sign in
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Verify OTP Form */}
          {step === "VERIFY_OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    6-Digit Passcode
                  </label>
                  <span className="font-mono text-xs text-primary">
                    Expires in: {formatCountdown(countdown)}
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="h-12 w-full rounded-lg bg-panel-strong/80 pl-10 pr-3 text-center font-mono text-xl tracking-[0.4em] text-foreground outline-none ring-1 ring-border/60 transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-sm text-primary-foreground shadow-panel transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    Verify OTP
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep("REQUEST_OTP")}
                  className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3" /> Change email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || (!canResend && countdown > 540)}
                  className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline disabled:opacity-40"
                >
                  <RotateCcw className="size-3" /> Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Reset Password Form */}
          {step === "RESET_PASSWORD" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
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
                    Updating password...
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

          {/* STEP 4: Success Message */}
          {step === "SUCCESS" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/20 text-primary">
                <CheckCircle2 className="size-7" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Password Updated Successfully
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can now log in using your new password. All prior reset sessions have been invalidated.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-sm text-primary-foreground shadow-panel transition-all hover:bg-primary/90"
              >
                Go to Sign in
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
