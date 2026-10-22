"use client";

import { FormEvent, useState, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Sparkles,
  ShieldAlert,
  User,
  Users,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Brain,
  HelpCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoLogins, setShowDemoLogins] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNotice, setForgotNotice] = useState("");

  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();
  const roleId = useId();

  // Password rules for registration
  const hasMinLength = password.length >= 10;
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  async function performLogin(targetEmail: string, targetPass: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || body.error || body.detail || "Unable to sign in. Please verify your credentials.");
      }
      if (body.role === "ADMIN") {
        router.push("/admin");
      } else if (body.role === "PARENT") {
        router.push("/parent");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The API could not be reached. Ensure the backend server is running.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (!isLogin && (!hasMinLength || !hasNumberOrSymbol || !hasUpper)) {
      setError("Please ensure your password meets all security requirements.");
      setBusy(false);
      return;
    }

    const payload = isLogin
      ? { email, password }
      : { name, role, email, password };

    try {
      const res = await fetch(`${API}/auth/${mode}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || body.error || body.detail || "Authentication request failed.");
      }
      if (body.role === "ADMIN") {
        router.push("/admin");
      } else if (body.role === "PARENT") {
        router.push("/parent");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The API could not be reached. Ensure the backend is active.");
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen flex flex-col bg-brand-primary text-brand-neutral">
      {/* Top Header */}
      <header className="border-b border-brand-neutral/20 bg-brand-primary/80 backdrop-blur-md sticky top-0 z-30">
        <div className="app-container h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <Logo size={28} />
          </Link>

          <Link
            href="/"
            className="text-xs text-brand-neutral hover:text-brand-neutral flex items-center gap-1.5 transition-colors font-medium"
          >
            Back to home <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left Column: Value Story */}
          <div className="hidden md:block space-y-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-brand-neutral">
              <Sparkles size={13} /> Source-Grounded Learning
            </span>

            <h1 className="text-3xl font-bold text-brand-light tracking-tight leading-tight">
              {isLogin ? "Your next focused hour starts here." : "A calm, structured way to master subjects."}
            </h1>

            <p className="text-xs sm:text-sm text-brand-neutral leading-relaxed">
              {isLogin
                ? "Access your course documents, adaptive review schedule, and verified focus history."
                : "Organize course notes into adaptive flashcards, source-grounded active recall quizzes, and monitored study sessions."}
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-brand-neutral">
                <div className="w-5 h-5 rounded-full bg-brand-accent/20 text-brand-neutral flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span>Adaptive study schedules balanced against your daily time</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-brand-neutral">
                <div className="w-5 h-5 rounded-full bg-brand-accent/20 text-brand-neutral flex items-center justify-center shrink-0">
                  <Brain size={12} />
                </div>
                <span>Active recall quizzes with verified source citations</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-brand-neutral">
                <div className="w-5 h-5 rounded-full bg-brand-accent/20 text-brand-neutral flex items-center justify-center shrink-0">
                  <BookOpen size={12} />
                </div>
                <span>Synchronized parent and student transparency ledger</span>
              </div>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <div className="p-6 sm:p-8 rounded-xl bg-brand-secondary border border-brand-neutral/20 shadow-xl">
            <div className="mb-5">
              <span className="text-[11px] font-mono text-brand-muted uppercase tracking-wider block mb-1">
                {isLogin ? "Welcome back" : "New Account"}
              </span>
              <h2 className="text-lg font-semibold text-brand-light">
                {isLogin ? "Sign in to your account" : "Create your study account"}
              </h2>
            </div>

            {/* Demo Accounts Pill Toggle */}
            {isLogin && (
              <div className="mb-5 p-2.5 rounded-lg bg-brand-raised border border-brand-neutral/25">
                <button
                  type="button"
                  onClick={() => setShowDemoLogins(!showDemoLogins)}
                  className="w-full flex items-center justify-between text-xs text-brand-neutral hover:text-brand-neutral transition-colors"
                  aria-expanded={showDemoLogins}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles size={12} className="text-brand-neutral" /> One-Click Demo Accounts
                  </span>
                  {showDemoLogins ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showDemoLogins && (
                  <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-brand-neutral/20">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("student@test.com");
                        setPassword("Password123!");
                        void performLogin("student@test.com", "Password123!");
                      }}
                      disabled={busy}
                      className="flex flex-col items-center justify-center py-2 px-1 rounded bg-brand-elevated hover:bg-brand-neutral/10 text-brand-neutral transition-colors text-[11px] font-medium"
                    >
                      <User size={13} className="text-brand-neutral mb-1" />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("parent@test.com");
                        setPassword("Password123!");
                        void performLogin("parent@test.com", "Password123!");
                      }}
                      disabled={busy}
                      className="flex flex-col items-center justify-center py-2 px-1 rounded bg-brand-elevated hover:bg-brand-neutral/10 text-brand-neutral transition-colors text-[11px] font-medium"
                    >
                      <Users size={13} className="text-emerald-400 mb-1" />
                      <span>Parent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("admin@test.com");
                        setPassword("Password123!");
                        void performLogin("admin@test.com", "Password123!");
                      }}
                      disabled={busy}
                      className="flex flex-col items-center justify-center py-2 px-1 rounded bg-brand-elevated hover:bg-brand-neutral/10 text-brand-neutral transition-colors text-[11px] font-medium"
                    >
                      <ShieldAlert size={13} className="text-rose-400 mb-1" />
                      <span>Admin</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="space-y-3.5">
              {!isLogin && (
                <>
                  <div>
                    <label htmlFor={nameId} className="block text-xs font-medium text-brand-neutral mb-1">
                      Full Name
                    </label>
                    <input
                      id={nameId}
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={120}
                      placeholder="e.g. Alex Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light placeholder:text-brand-muted focus:outline-none focus:border-brand-neutral/40 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor={roleId} className="block text-xs font-medium text-brand-neutral mb-1">
                      Account Type
                    </label>
                    <select
                      id={roleId}
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light focus:outline-none focus:border-brand-neutral/40 transition-colors"
                    >
                      <option value="STUDENT">Student (Study materials, quizzes & tasks)</option>
                      <option value="PARENT">Parent (Monitor student progress & scores)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label htmlFor={emailId} className="block text-xs font-medium text-brand-neutral mb-1">
                  Email Address
                </label>
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light placeholder:text-brand-muted focus:outline-none focus:border-brand-neutral/40 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor={passwordId} className="block text-xs font-medium text-brand-neutral">
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-[11px] text-brand-muted hover:text-brand-neutral transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    id={passwordId}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    minLength={isLogin ? 1 : 10}
                    maxLength={72}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 pr-9 text-xs text-brand-light placeholder:text-brand-muted focus:outline-none focus:border-brand-neutral/40 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-neutral"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Password Rules Checklist */}
                {!isLogin && (
                  <div className="mt-2 p-2.5 rounded-lg bg-brand-raised border border-brand-neutral/25 space-y-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : "text-brand-muted"}`}>
                      <Check size={11} strokeWidth={3} />
                      <span>At least 10 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-400" : "text-brand-muted"}`}>
                      <Check size={11} strokeWidth={3} />
                      <span>At least one uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? "text-emerald-400" : "text-brand-muted"}`}>
                      <Check size={11} strokeWidth={3} />
                      <span>At least one number or symbol</span>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div role="alert" className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={busy}
                className="w-full h-9 text-xs font-medium mt-2"
              >
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center text-xs text-brand-muted">
              {isLogin ? "New to Smart Study?" : "Already registered?"}{" "}
              <Link
                href={isLogin ? "/register" : "/login"}
                className="text-brand-neutral hover:text-brand-light font-medium"
              >
                {isLogin ? "Create account" : "Sign in here"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-primary/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setForgotModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-brand-secondary border border-brand-neutral/20 p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-light">Reset Password</h3>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="text-brand-muted hover:text-brand-neutral"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-brand-neutral">
              Enter your registered email address. We will dispatch a password recovery link.
            </p>

            {forgotNotice ? (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs">
                {forgotNotice}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotNotice(`If an account exists for ${forgotEmail}, instructions have been sent.`);
                }}
                className="space-y-3"
              >
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light placeholder:text-brand-muted focus:outline-none focus:border-brand-neutral/40"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setForgotModalOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" className="text-xs">
                    Send Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
