"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Award,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Mail,
  UserX,
  Sparkles,
  AlertTriangle,
  BarChart3,
  ListTodo,
  Calendar,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Navbar } from "../navbar";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";

type Child = {
  id: number;
  name: string;
  email: string;
  linkId?: number;
  linkedSince?: string;
};

type SentLink = {
  id: number;
  student: { id: number; name: string; email: string };
  status: string;
  createdAt: string;
};

type QuizRecord = {
  id: number;
  quizId: number;
  title: string;
  score: number;
  total: number;
  accuracyPercent: number;
  submittedAt: string;
};

type SessionRecord = {
  id: number;
  title?: string;
  durationMinutes: number;
  durationSeconds?: number;
  status: string;
  startedAt: string;
};

type TaskRecord = {
  id: number;
  title: string;
  status: string;
  priority: string;
  estimatedMinutes: number;
  scheduledDate?: string;
};

type MaterialRecord = {
  id: number;
  title: string;
  status: string;
  createdAt: string;
};

type Report = {
  student?: { id: number; name: string; email: string };
  studyMinutes: number;
  todayStudyMinutes: number;
  weeklyStudyMinutes: number;
  tasksCompleted: number;
  tasksTotal: number;
  taskCompletionPercent: number;
  quizAttempts: number;
  quizAccuracyPercent: number;
  materialsTotal?: number;
  statusAssessment?: string;
  recentQuizzes?: QuizRecord[];
  recentSessions?: SessionRecord[];
  recentTasks?: TaskRecord[];
  materialsStudied?: MaterialRecord[];
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr${h > 1 ? "s" : ""}` : `${h} hr ${m} min`;
}

export default function ParentPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [sentLinks, setSentLinks] = useState<SentLink[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [reports, setReports] = useState<Record<number, Report>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"overview" | "quizzes" | "sessions" | "tasks" | "materials">("overview");

  // Confirmation dialogs
  const [linkToCancel, setLinkToCancel] = useState<{ id: number; name: string } | null>(null);
  const [studentToDisconnect, setStudentToDisconnect] = useState<{ linkId: number; name: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [childrenRes, sentRes] = await Promise.all([
        fetch(`${API}/parents/children`, { credentials: "include" }),
        fetch(`${API}/parents/links/sent`, { credentials: "include" }),
      ]);

      if (childrenRes.status === 401) {
        router.push("/login");
        return;
      }

      if (!childrenRes.ok) {
        throw new Error("This portal is reserved for parent accounts. Please sign in with a parent role.");
      }

      const childrenData: Child[] = await childrenRes.json();
      setChildren(childrenData);

      if (sentRes.ok) {
        const sentData: SentLink[] = await sentRes.json();
        setSentLinks(sentData);
      }

      if (childrenData.length > 0) {
        const activeId = selectedChildId && childrenData.some((c) => c.id === selectedChildId)
          ? selectedChildId
          : childrenData[0].id;
        setSelectedChildId(activeId);
        await loadChildReport(activeId);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load linked student profiles.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, selectedChildId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  async function loadChildReport(studentId: number) {
    try {
      const response = await fetch(`${API}/parents/children/${studentId}/progress`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Could not load student progress report.");
      const data = (await response.json()) as Report;
      setReports((curr) => ({ ...curr, [studentId]: data }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load student progress details.");
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    if (selectedChildId) {
      await loadChildReport(selectedChildId);
    }
    await loadData();
  }

  async function handleSendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = (data.get("email") as string)?.trim();
    if (!email) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API}/parents/links`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentEmail: email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not send access request. Please check the email.");
      }
      setNotice(`Access request sent to ${result.student.name} (${result.student.email}). They will see an approval prompt on their dashboard.`);
      form.reset();
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send the link request.");
    } finally {
      setBusy(false);
    }
  }

  async function executeCancelLink(linkId: number) {
    try {
      const res = await fetch(`${API}/parents/links/${linkId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Could not cancel this request.");
      setNotice("Student connection request updated.");
      setLinkToCancel(null);
      setStudentToDisconnect(null);
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel link.");
    }
  }

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const activeReport = selectedChildId ? reports[selectedChildId] : null;

  // Study inactivity warning
  const isInactive = activeReport && activeReport.weeklyStudyMinutes === 0 && activeReport.studyMinutes === 0;

  return (
    <>
      <Navbar />
      <main className="app-container" style={{ paddingBottom: "100px", paddingTop: "24px" }}>
        <PageHeader
          eyebrow="Family Academic Oversight"
          title="Parent Portal"
          description="Support your student's learning journey with real-time visibility into their study sessions, quiz comprehension, and scheduled deadlines."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleRefresh()}
              loading={refreshing}
              icon={<RefreshCw size={14} />}
            >
              Refresh Telemetry
            </Button>
          }
        />

        {error && (
          <div
            role="alert"
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              background: "rgba(255, 107, 107, 0.1)",
              border: "1px solid rgba(255, 107, 107, 0.3)",
              color: "var(--danger)",
              fontSize: "13px",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              background: "rgba(196, 255, 106, 0.08)",
              border: "1px solid rgba(196, 255, 106, 0.25)",
              color: "var(--accent-lime)",
              fontSize: "13px",
              marginBottom: "24px",
            }}
          >
            {notice}
          </div>
        )}

        {/* Link Student Account Card */}
        <section
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "20px",
            padding: "24px 28px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px" }}>
                Link a Student Account
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--mist)" }}>
                Send an invitation to your student's registered email. Once approved from their dashboard, their progress will display here.
              </p>
            </div>

            <form
              onSubmit={handleSendRequest}
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative" }}>
                <Mail
                  size={15}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--mist)",
                  }}
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="student@example.com"
                  style={{
                    height: "44px",
                    padding: "0 14px 0 38px",
                    borderRadius: "10px",
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--paper)",
                    fontSize: "13px",
                    minWidth: "260px",
                  }}
                />
              </div>
              <Button
                variant="primary"
                size="default"
                type="submit"
                loading={busy}
                icon={<Send size={15} />}
                style={{ minHeight: "44px" }}
              >
                Send Request
              </Button>
            </form>
          </div>

          {/* Pending Invitations Strip */}
          {sentLinks.length > 0 && (
            <div
              style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--mist)",
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                Pending Authorization Requests ({sentLinks.length})
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {sentLinks.map((link) => (
                  <div
                    key={link.id}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px dashed var(--border-subtle)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "13px",
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", color: "var(--paper)" }}>
                        {link.student.name}
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--mist)" }}>
                        {link.student.email} • Pending approval
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setLinkToCancel({ id: link.id, name: link.student.name })
                      }
                      style={{ fontSize: "12px", height: "32px", padding: "0 8px", color: "var(--danger)" }}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Linked Students & Reports Section */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--mist)" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            <p>Loading linked student profiles...</p>
          </div>
        ) : children.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Linked Students Yet"
            description="Enter your student's registered email above to send an authorization link. Once approved, their verified focus sessions, task velocity, and quiz scores will automatically appear here."
          />
        ) : (
          <div>
            {/* Student Switcher Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--mist)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Active Student:
                </span>
                {children.map((c) => {
                  const active = selectedChildId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedChildId(c.id);
                        if (!reports[c.id]) void loadChildReport(c.id);
                      }}
                      style={{
                        minHeight: "44px",
                        padding: "8px 18px",
                        borderRadius: "12px",
                        border: active
                          ? "1px solid var(--accent-lime)"
                          : "1px solid var(--border-subtle)",
                        background: active
                          ? "rgba(196, 255, 106, 0.12)"
                          : "rgba(255, 255, 255, 0.03)",
                        color: active ? "var(--accent-lime)" : "var(--paper)",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: active ? "0 0 16px rgba(196, 255, 106, 0.12)" : "none",
                      }}
                    >
                      <Users size={15} />
                      {c.name}
                    </button>
                  );
                })}
              </div>

              {selectedChild?.linkId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setStudentToDisconnect({
                      linkId: selectedChild.linkId!,
                      name: selectedChild.name,
                    })
                  }
                  icon={<UserX size={14} />}
                  style={{ color: "var(--danger)" }}
                >
                  Disconnect Student
                </Button>
              )}
            </div>

            {/* Inactivity Alert Banner if applicable */}
            {isInactive && (
              <div
                style={{
                  padding: "14px 20px",
                  borderRadius: "14px",
                  background: "rgba(255, 151, 127, 0.08)",
                  border: "1px solid rgba(255, 151, 127, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                <ShieldAlert size={18} color="var(--danger)" />
                <div style={{ fontSize: "13px", color: "var(--paper)" }}>
                  <strong>Activity Alert:</strong> {selectedChild?.name} has not recorded any verified study sessions or task completions yet. Consider reviewing their schedule together.
                </div>
              </div>
            )}

            {/* Selected Child Academic Overview */}
            {activeReport ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Data-Driven Honest Status Assessment Banner */}
                {activeReport.statusAssessment && (
                  <div
                    style={{
                      background: activeReport.statusAssessment.includes("Needs") ||
                        activeReport.statusAssessment.includes("Review")
                        ? "rgba(255, 151, 127, 0.07)"
                        : "rgba(196, 255, 106, 0.07)",
                      border: activeReport.statusAssessment.includes("Needs") ||
                        activeReport.statusAssessment.includes("Review")
                        ? "1px solid rgba(255, 151, 127, 0.3)"
                        : "1px solid rgba(196, 255, 106, 0.25)",
                      borderRadius: "16px",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: activeReport.statusAssessment.includes("Needs") ||
                          activeReport.statusAssessment.includes("Review")
                          ? "rgba(255, 107, 107, 0.15)"
                          : "rgba(196, 255, 106, 0.15)",
                        color: activeReport.statusAssessment.includes("Needs") ||
                          activeReport.statusAssessment.includes("Review")
                          ? "var(--danger)"
                          : "var(--accent-lime)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--mist)",
                          fontWeight: 700,
                        }}
                      >
                        Academic Status Assessment
                      </span>
                      <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 600, color: "var(--paper)" }}>
                        {activeReport.statusAssessment}
                      </p>
                    </div>
                  </div>
                )}

                {/* 4 Core Stat Cards (Synchronized with student database) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {/* 1. Study Time */}
                  <StatCard
                    label="Total Study Time"
                    value={activeReport.studyMinutes}
                    unit="mins"
                    icon={Clock}
                    iconColor="var(--accent-lime)"
                    subtext={`Today: ${activeReport.todayStudyMinutes}m | Past 7 days: ${activeReport.weeklyStudyMinutes}m`}
                  />

                  {/* 2. Tasks Completed */}
                  <StatCard
                    label="Task Completion"
                    value={`${activeReport.tasksCompleted}/${activeReport.tasksTotal}`}
                    icon={CheckCircle2}
                    iconColor="var(--mint)"
                    progressPercent={activeReport.taskCompletionPercent}
                    subtext={`${activeReport.taskCompletionPercent}% schedule velocity`}
                  />

                  {/* 3. Quiz Accuracy */}
                  <StatCard
                    label="Quiz Accuracy"
                    value={activeReport.quizAttempts > 0 ? `${activeReport.quizAccuracyPercent}%` : "—"}
                    icon={Award}
                    iconColor="#f6c445"
                    subtext={`Based on ${activeReport.quizAttempts} test attempt${activeReport.quizAttempts === 1 ? "" : "s"}`}
                  />

                  {/* 4. Study Library */}
                  <StatCard
                    label="Study Library"
                    value={activeReport.materialsTotal ?? activeReport.materialsStudied?.length ?? 0}
                    unit="docs"
                    icon={BookOpen}
                    iconColor="var(--info)"
                    subtext="Processed course notes & textbooks"
                  />
                </div>

                {/* Sub-Navigation Tabs with Lucide Icons (Replacing emoji icons) */}
                <div
                  role="tablist"
                  aria-label="Parent view tabs"
                  style={{
                    display: "flex",
                    borderBottom: "1px solid var(--border-subtle)",
                    gap: "12px",
                    marginTop: "8px",
                    overflowX: "auto",
                    paddingBottom: "2px",
                  }}
                >
                  {[
                    {
                      key: "overview",
                      label: "Overview & Recents",
                      icon: BarChart3,
                    },
                    {
                      key: "quizzes",
                      label: `Quizzes (${activeReport.recentQuizzes?.length ?? 0})`,
                      icon: Award,
                    },
                    {
                      key: "sessions",
                      label: `Study Sessions (${activeReport.recentSessions?.length ?? 0})`,
                      icon: Clock,
                    },
                    {
                      key: "tasks",
                      label: `Tasks (${activeReport.recentTasks?.length ?? 0})`,
                      icon: ListTodo,
                    },
                    {
                      key: "materials",
                      label: `Library (${activeReport.materialsTotal ?? activeReport.materialsStudied?.length ?? 0})`,
                      icon: BookOpen,
                    },
                  ].map((tab) => {
                    const active = activeTab === tab.key;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        style={{
                          minHeight: "44px",
                          padding: "10px 14px",
                          background: "none",
                          border: "none",
                          borderBottom: active ? "2px solid var(--accent-lime)" : "2px solid transparent",
                          color: active ? "var(--accent-lime)" : "var(--mist)",
                          fontWeight: active ? 600 : 500,
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          whiteSpace: "nowrap",
                          transition: "color 0.15s ease",
                        }}
                      >
                        <Icon size={15} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab 1: Overview */}
                {activeTab === "overview" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                      gap: "24px",
                    }}
                  >
                    {/* Recent Quizzes Snapshot */}
                    <div
                      style={{
                        background: "var(--surface-1)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "18px",
                        padding: "24px",
                      }}
                    >
                      <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Award size={16} color="var(--accent-lime)" /> Recent Quiz Comprehension
                      </h3>
                      {activeReport.recentQuizzes && activeReport.recentQuizzes.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {activeReport.recentQuizzes.slice(0, 4).map((q) => (
                            <div
                              key={q.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px 14px",
                                background: "rgba(255, 255, 255, 0.02)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "10px",
                              }}
                            >
                              <div>
                                <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--paper)" }}>
                                  {q.title}
                                </span>
                                <span style={{ fontSize: "11px", color: "var(--mist)" }}>
                                  {new Date(q.submittedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: q.accuracyPercent >= 70 ? "var(--accent-lime)" : "var(--danger)",
                                  background: q.accuracyPercent >= 70 ? "rgba(196,255,106,0.1)" : "rgba(255,107,107,0.1)",
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                }}
                              >
                                {q.score}/{q.total} ({q.accuracyPercent}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "13px", color: "var(--mist)", margin: 0 }}>No quizzes taken yet.</p>
                      )}
                    </div>

                    {/* Recent Focus Sessions Snapshot */}
                    <div
                      style={{
                        background: "var(--surface-1)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "18px",
                        padding: "24px",
                      }}
                    >
                      <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Clock size={16} color="var(--mint)" /> Recent Focus Sessions
                      </h3>
                      {activeReport.recentSessions && activeReport.recentSessions.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {activeReport.recentSessions.slice(0, 4).map((s) => (
                            <div
                              key={s.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px 14px",
                                background: "rgba(255, 255, 255, 0.02)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "10px",
                              }}
                            >
                              <div>
                                <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--paper)" }}>
                                  {s.title || "General Focus & Study"}
                                </span>
                                <span style={{ fontSize: "11px", color: "var(--mist)" }}>
                                  {new Date(s.startedAt).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: "var(--accent-lime)",
                                  background: "rgba(196,255,106,0.1)",
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                }}
                              >
                                {formatDuration(s.durationMinutes)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "13px", color: "var(--mist)", margin: 0 }}>No study sessions logged yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: All Quizzes */}
                {activeTab === "quizzes" && (
                  <div
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "18px",
                      padding: "24px",
                    }}
                  >
                    <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px" }}>
                      Quiz History & Accuracy
                    </h3>
                    {activeReport.recentQuizzes && activeReport.recentQuizzes.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {activeReport.recentQuizzes.map((q) => (
                          <div
                            key={q.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "14px 18px",
                              background: "rgba(255, 255, 255, 0.02)",
                              borderRadius: "12px",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: "14px", color: "var(--paper)", display: "block" }}>
                                {q.title}
                              </strong>
                              <span style={{ fontSize: "12px", color: "var(--mist)" }}>
                                Completed {new Date(q.submittedAt).toLocaleString()}
                              </span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 700,
                                  color: q.accuracyPercent >= 70 ? "var(--accent-lime)" : "var(--danger)",
                                }}
                              >
                                {q.score} / {q.total}
                              </span>
                              <span style={{ display: "block", fontSize: "11px", color: "var(--mist)" }}>
                                {q.accuracyPercent}% Accuracy
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "var(--mist)" }}>
                        No quizzes completed by this student yet.
                      </p>
                    )}
                  </div>
                )}

                {/* Tab 3: All Sessions */}
                {activeTab === "sessions" && (
                  <div
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "18px",
                      padding: "24px",
                    }}
                  >
                    <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px" }}>
                      Verified Study Sessions
                    </h3>
                    {activeReport.recentSessions && activeReport.recentSessions.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {activeReport.recentSessions.map((s) => (
                          <div
                            key={s.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "14px 18px",
                              background: "rgba(255, 255, 255, 0.02)",
                              borderRadius: "12px",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <div>
                              <span style={{ fontSize: "14px", fontWeight: 600, display: "block", color: "var(--paper)" }}>
                                {s.title || "General Focus & Study"}
                              </span>
                              <span style={{ fontSize: "12px", color: "var(--mist)" }}>
                                {new Date(s.startedAt).toLocaleString()}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  background: "rgba(196, 255, 106, 0.1)",
                                  color: "var(--accent-lime)",
                                  fontWeight: 600,
                                }}
                              >
                                {s.status}
                              </span>
                              <strong style={{ fontSize: "15px", color: "var(--accent-lime)" }}>
                                {formatDuration(s.durationMinutes)}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "var(--mist)" }}>
                        No study sessions recorded yet.
                      </p>
                    )}
                  </div>
                )}

                {/* Tab 4: Study Tasks */}
                {activeTab === "tasks" && (
                  <div
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "18px",
                      padding: "24px",
                    }}
                  >
                    <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px" }}>
                      Scheduled Tasks & Milestones
                    </h3>
                    {activeReport.recentTasks && activeReport.recentTasks.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {activeReport.recentTasks.map((t) => (
                          <div
                            key={t.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "14px 18px",
                              background: "rgba(255, 255, 255, 0.02)",
                              borderRadius: "12px",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  fontSize: "14px",
                                  color: t.status === "COMPLETED" ? "var(--mist)" : "var(--paper)",
                                  textDecoration: t.status === "COMPLETED" ? "line-through" : "none",
                                }}
                              >
                                {t.title}
                              </strong>
                              {t.scheduledDate && (
                                <span style={{ display: "block", fontSize: "11px", color: "var(--mist)", marginTop: "2px" }}>
                                  Target date: {t.scheduledDate}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  background: "rgba(255, 255, 255, 0.06)",
                                  color: "var(--mist)",
                                }}
                              >
                                {t.estimatedMinutes}m est.
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  background:
                                    t.status === "COMPLETED"
                                      ? "rgba(196, 255, 106, 0.12)"
                                      : "rgba(255, 204, 0, 0.12)",
                                  color:
                                    t.status === "COMPLETED" ? "var(--accent-lime)" : "#f6c445",
                                  fontWeight: 600,
                                }}
                              >
                                {t.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "var(--mist)" }}>No tasks scheduled yet.</p>
                    )}
                  </div>
                )}

                {/* Tab 5: Library */}
                {activeTab === "materials" && (
                  <div
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "18px",
                      padding: "24px",
                    }}
                  >
                    <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px" }}>
                      Uploaded Study Materials
                    </h3>
                    {activeReport.materialsStudied && activeReport.materialsStudied.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {activeReport.materialsStudied.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "14px 18px",
                              background: "rgba(255, 255, 255, 0.02)",
                              borderRadius: "12px",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <BookOpen size={16} color="var(--accent-lime)" />
                              <div>
                                <strong style={{ fontSize: "14px", color: "var(--paper)", display: "block" }}>
                                  {m.title}
                                </strong>
                                <span style={{ fontSize: "11px", color: "var(--mist)" }}>
                                  Uploaded on {new Date(m.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                background: "rgba(196, 255, 106, 0.1)",
                                color: "var(--accent-lime)",
                                fontWeight: 600,
                              }}
                            >
                              {m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "var(--mist)" }}>No documents uploaded yet.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--mist)" }}>
                <p>Loading student report details...</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cancel Link Request Dialog */}
      {linkToCancel && (
        <ConfirmDialog
          isOpen={true}
          title="Cancel Link Request?"
          description={`Are you sure you want to cancel the pending authorization request for ${linkToCancel.name}?`}
          confirmLabel="Cancel Request"
          cancelLabel="Keep Request"
          danger={true}
          onConfirm={() => void executeCancelLink(linkToCancel.id)}
          onCancel={() => setLinkToCancel(null)}
        />
      )}

      {/* Disconnect Student Dialog */}
      {studentToDisconnect && (
        <ConfirmDialog
          isOpen={true}
          title={`Disconnect from ${studentToDisconnect.name}?`}
          description="Are you sure you want to remove this student connection? You will no longer have access to their study sessions, task updates, or quiz scores until re-authorized."
          confirmLabel="Disconnect Student"
          cancelLabel="Keep Connected"
          danger={true}
          onConfirm={() => void executeCancelLink(studentToDisconnect.linkId)}
          onCancel={() => setStudentToDisconnect(null)}
        />
      )}
    </>
  );
}
