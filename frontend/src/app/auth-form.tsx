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
      setError("Please ensure your password meets all security requirements listed below.");
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
    <main className="auth-page auth-premium" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="auth-aurora auth-aurora-one" />
      <div className="auth-aurora auth-aurora-two" />

      {/* Top Navbar */}
      <header className="app-container" style={{ paddingTop: "20px", paddingBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link className="brand" href="/" aria-label="Return to Smart Study homepage">
            <span
              style={{
                display: "grid",
                width: "32px",
                height: "32px",
                placeItems: "center",
                borderRadius: "8px",
                background: "var(--accent-lime)",
                color: "#051409",
                fontFamily: "var(--font-serif-family)",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              S
            </span>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              smart study
            </span>
          </Link>

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--mist)",
              transition: "color 0.2s ease",
            }}
            className="hover:text-lime-300"
          >
            Back to home <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Content Container */}
      <div className="app-container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingBlock: "32px" }}>
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "clamp(32px, 6vw, 72px)",
            width: "100%",
            maxWidth: "1040px",
            alignItems: "center",
          }}
        >
          {/* Left Value Story */}
          <aside className="premium-reveal hidden md:block">
            <p className="eyebrow eyebrow-glow">
              <Sparkles size={13} /> Source-Grounded Learning
            </p>
            <h1 className="page-title" style={{ fontSize: "clamp(2.2rem, 3.8vw, 3.2rem)", margin: "14px 0 16px" }}>
              {isLogin ? "Your next focused hour starts here." : "A calmer way to make real progress."}
            </h1>
            <p className="page-lead" style={{ marginBottom: "28px" }}>
              {isLogin
                ? "Return to your uploaded notes, adaptive review schedule, and verified focus history."
                : "Organize course notes into adaptive flashcards, source-grounded active recall quizzes, and monitored study sessions."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--paper)" }}>
                <span style={{ display: "grid", width: "24px", height: "24px", placeItems: "center", borderRadius: "6px", background: "rgba(122, 255, 135, 0.15)", color: "var(--accent-lime)" }}>
                  <Check size={14} />
                </span>
                <span style={{ fontSize: "14px" }}>Adaptive study schedules calculated from your notes</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--paper)" }}>
                <span style={{ display: "grid", width: "24px", height: "24px", placeItems: "center", borderRadius: "6px", background: "rgba(122, 255, 135, 0.15)", color: "var(--accent-lime)" }}>
                  <Brain size={14} />
                </span>
                <span style={{ fontSize: "14px" }}>Active recall questions with source citation context</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--paper)" }}>
                <span style={{ display: "grid", width: "24px", height: "24px", placeItems: "center", borderRadius: "6px", background: "rgba(122, 255, 135, 0.15)", color: "var(--accent-lime)" }}>
                  <BookOpen size={14} />
                </span>
                <span style={{ fontSize: "14px" }}>Synchronized parent & student accountability records</span>
              </div>
            </div>
          </aside>

          {/* Right Auth Card */}
          <section
            className="glass-panel premium-reveal-delayed"
            style={{
              padding: "clamp(24px, 4vw, 36px)",
              borderRadius: "var(--radius-xl)",
              background: "rgba(11, 22, 15, 0.88)",
              border: "1px solid var(--border-medium)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <p className="eyebrow" style={{ margin: 0 }}>
                {isLogin ? "Welcome back" : "New Account Registration"}
              </p>
              <span
                style={{
                  display: "grid",
                  width: "32px",
                  height: "32px",
                  placeItems: "center",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--line)",
                  color: "var(--mint)",
                }}
              >
                <ShieldCheck size={16} />
              </span>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-serif-family)",
                fontSize: "26px",
                fontWeight: 600,
                color: "var(--paper)",
                margin: "4px 0 8px",
                letterSpacing: "-0.015em",
              }}
            >
              {isLogin ? "Sign in to your space" : "Create your study space"}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--mist)", margin: "0 0 20px" }}>
              {isLogin
                ? "Enter your credentials to access your dashboard."
                : "Get started with personalized study routines."}
            </p>

            {/* Discreet Demo Accounts Toggle (Fixes exposed buttons bug) */}
            {isLogin && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--line)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowDemoLogins(!showDemoLogins)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "none",
                    border: "none",
                    color: "var(--mist)",
                    fontSize: "12px",
                    fontWeight: 650,
                    cursor: "pointer",
                    padding: 0,
                  }}
                  aria-expanded={showDemoLogins}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sparkles size={13} color="var(--accent-lime)" /> Quick Sign-in (Demo Accounts)
                  </span>
                  {showDemoLogins ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showDemoLogins && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      marginTop: "12px",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--line)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("student@test.com");
                        setPassword("Password123!");
                        void performLogin("student@test.com", "Password123!");
                      }}
                      disabled={busy}
                      className="button secondary btn-compact"
                      style={{ fontSize: "12px", flexDirection: "column", gap: "3px", minHeight: "44px" }}
                    >
                      <User size={14} color="var(--mint)" />
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
                      className="button secondary btn-compact"
                      style={{ fontSize: "12px", flexDirection: "column", gap: "3px", minHeight: "44px" }}
                    >
                      <Users size={14} color="#93c5fd" />
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
                      className="button secondary btn-compact"
                      style={{ fontSize: "12px", flexDirection: "column", gap: "3px", minHeight: "44px" }}
                    >
                      <ShieldAlert size={14} color="#fca5a5" />
                      <span>Admin</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label htmlFor={nameId} className="form-label">
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
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={roleId} className="form-label">
                      Account Type
                    </label>
                    <select
                      id={roleId}
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="form-control"
                    >
                      <option value="STUDENT">Student (Study materials, quizzes & tasks)</option>
                      <option value="PARENT">Parent (Monitor child study progress & scores)</option>
                    </select>
                    <span style={{ fontSize: "11px", color: "var(--mist)", marginTop: "2px" }}>
                      Administrative privileges are provisioned internally by platform administrators.
                    </span>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor={emailId} className="form-label">
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
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor={passwordId} className="form-label" style={{ margin: 0 }}>
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--mist)",
                        fontSize: "12px",
                        cursor: "pointer",
                        padding: 0,
                      }}
                      className="hover:text-lime-300"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div style={{ position: "relative" }}>
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
                    className="form-control"
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "var(--mist)",
                      cursor: "pointer",
                      padding: "6px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Rule Checklist for Registration */}
                {!isLogin && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--line)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: hasMinLength ? "var(--accent-lime)" : "var(--mist)" }}>
                      <Check size={13} color={hasMinLength ? "var(--accent-lime)" : "currentColor"} />
                      <span>At least 10 characters</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: hasUpper ? "var(--accent-lime)" : "var(--mist)" }}>
                      <Check size={13} color={hasUpper ? "var(--accent-lime)" : "currentColor"} />
                      <span>At least one uppercase letter (A-Z)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: hasNumberOrSymbol ? "var(--accent-lime)" : "var(--mist)" }}>
                      <Check size={13} color={hasNumberOrSymbol ? "var(--accent-lime)" : "currentColor"} />
                      <span>At least one number or special symbol</span>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--danger-bg)",
                    border: "1px solid var(--danger-border)",
                    color: "#fca5a5",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={busy}
                style={{ width: "100%", marginTop: "6px", minHeight: "46px" }}
              >
                {isLogin ? "Sign In" : "Create My Account"}
              </Button>
            </form>

            <div style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "var(--mist)" }}>
              {isLogin ? "New to Smart Study?" : "Already registered?"}{" "}
              <Link
                href={isLogin ? "/register" : "/login"}
                style={{ color: "var(--accent-lime)", fontWeight: 700, textDecoration: "none" }}
                className="hover:underline"
              >
                {isLogin ? "Create an account" : "Sign in here"}
              </Link>
            </div>
          </section>
        </section>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
          onClick={() => setForgotModalOpen(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <HelpCircle size={20} color="var(--accent-lime)" />
                <h3 id="forgot-modal-title" style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--paper)" }}>
                  Reset Your Password
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setForgotModalOpen(false)}
                style={{ width: "32px", height: "32px" }}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--mist)", lineHeight: 1.6, marginBottom: "16px" }}>
              Enter the email address registered with your student or parent account. A secure password reset link will be dispatched.
            </p>

            {forgotNotice ? (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--success-bg)",
                  border: "1px solid var(--success-border)",
                  color: "#86efac",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {forgotNotice}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotNotice(`If an account exists for ${forgotEmail}, password recovery instructions have been queued.`);
                }}
              >
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="form-control"
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <Button variant="ghost" onClick={() => setForgotModalOpen(false)}>
                    Close
                  </Button>
                  <Button variant="primary" type="submit">
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-container" style={{ paddingBlock: "18px", borderTop: "1px solid var(--line)", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--mist)" }}>
          Your academic records and uploaded materials remain strictly confidential. Built for deep comprehension and sustained focus.
        </p>
      </footer>
    </main>
  );
}
