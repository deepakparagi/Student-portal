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
  AlertCircle,
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
  const isInactive = activeReport && activeReport.weeklyStudyMinutes === 0 && activeReport.studyMinutes === 0;

  return (
    <div className="min-h-screen flex flex-col bg-brand-primary text-brand-neutral">
      <Navbar />

      <main className="app-container page-wrapper flex-1 py-8">
        <PageHeader
          eyebrow="Academic Oversight"
          eyebrowIcon={<Users size={13} className="text-brand-neutral" />}
          title="Parent Portal"
          description="Support your student's learning journey with real-time visibility into study sessions, quiz comprehension, and tasks."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleRefresh()}
              loading={refreshing}
              icon={<RefreshCw size={13} />}
              className="text-xs"
            >
              Refresh
            </Button>
          }
        />

        {error && (
          <div role="alert" className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs font-medium mb-6">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div role="status" className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-6">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Link Student Account Card */}
        <section className="p-5 sm:p-6 rounded-xl bg-brand-secondary border border-brand-neutral/20 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-brand-light">Link Student Account</h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Send an invitation to your student&apos;s email. Once approved on their dashboard, progress will appear here.
              </p>
            </div>

            <form onSubmit={handleSendRequest} className="flex items-center gap-2">
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="student@example.com"
                  className="w-56 sm:w-64 bg-brand-raised border border-brand-neutral/25 rounded-lg pl-8 pr-3 py-1.5 text-xs text-brand-light placeholder:text-brand-muted focus:outline-none focus:border-brand-neutral/40"
                />
              </div>
              <Button type="submit" variant="primary" size="sm" loading={busy} icon={<Send size={12} />} className="text-xs py-1.5 px-3">
                Send
              </Button>
            </form>
          </div>

          {/* Pending Invitations Strip */}
          {sentLinks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-brand-neutral/20">
              <span className="text-[11px] font-mono text-brand-muted uppercase tracking-wider block mb-2">
                Pending Authorization Requests ({sentLinks.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {sentLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-brand-raised border border-brand-neutral/25 text-xs"
                  >
                    <div>
                      <span className="font-medium text-brand-neutral">{link.student.name}</span>
                      <span className="text-brand-muted text-[11px] ml-1.5">({link.student.email})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLinkToCancel({ id: link.id, name: link.student.name })}
                      className="text-[11px] text-rose-400 hover:text-rose-300 ml-1"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Linked Students & Reports Section */}
        {loading ? (
          <div className="text-center py-16 text-brand-muted text-xs">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-brand-neutral" />
            <p>Loading linked student profiles...</p>
          </div>
        ) : children.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Linked Students"
            description="Enter your student's registered email above to send an authorization invitation."
          />
        ) : (
          <div>
            {/* Student Switcher Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-brand-muted">Student:</span>
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
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        active
                          ? "bg-brand-accent/20 border-brand-neutral/40 text-brand-light"
                          : "bg-brand-raised border-brand-neutral/20 text-brand-neutral hover:text-brand-neutral"
                      }`}
                    >
                      <Users size={12} />
                      {c.name}
                    </button>
                  );
                })}
              </div>

              {selectedChild?.linkId && (
                <button
                  type="button"
                  onClick={() =>
                    setStudentToDisconnect({
                      linkId: selectedChild.linkId!,
                      name: selectedChild.name,
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors self-start sm:self-auto"
                >
                  <UserX size={12} />
                  <span>Disconnect</span>
                </button>
              )}
            </div>

            {/* Inactivity Alert Banner */}
            {isInactive && (
              <div className="flex items-center gap-3 p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 mb-6">
                <ShieldAlert size={16} className="shrink-0 text-amber-400" />
                <div>
                  <strong>Activity Notice:</strong> {selectedChild?.name} has not recorded any verified study sessions or task completions this week.
                </div>
              </div>
            )}

            {/* Selected Child Academic Overview */}
            {activeReport ? (
              <div className="space-y-6">
                {/* Academic Status Assessment Banner */}
                {activeReport.statusAssessment && (
                  <div className="p-4 rounded-xl bg-brand-secondary border border-brand-neutral/20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-accent/20 text-brand-neutral flex items-center justify-center shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block">
                        Academic Status Assessment
                      </span>
                      <p className="text-xs font-medium text-brand-neutral mt-0.5">
                        {activeReport.statusAssessment}
                      </p>
                    </div>
                  </div>
                )}

                {/* 4 Core Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <StatCard
                    label="Total Study Time"
                    value={activeReport.studyMinutes}
                    unit="mins"
                    icon={Clock}
                    iconColor="#7692FF"
                    subtext={`Today: ${activeReport.todayStudyMinutes}m | Week: ${activeReport.weeklyStudyMinutes}m`}
                  />

                  <StatCard
                    label="Task Completion"
                    value={`${activeReport.tasksCompleted}/${activeReport.tasksTotal}`}
                    icon={CheckCircle2}
                    iconColor="#10b981"
                    progressPercent={activeReport.taskCompletionPercent}
                    subtext={`${activeReport.taskCompletionPercent}% schedule velocity`}
                  />

                  <StatCard
                    label="Quiz Accuracy"
                    value={activeReport.quizAttempts > 0 ? `${activeReport.quizAccuracyPercent}%` : "—"}
                    icon={Award}
                    iconColor="#f59e0b"
                    subtext={`Based on ${activeReport.quizAttempts} test attempt${activeReport.quizAttempts === 1 ? "" : "s"}`}
                  />

                  <StatCard
                    label="Study Library"
                    value={activeReport.materialsTotal ?? activeReport.materialsStudied?.length ?? 0}
                    unit="docs"
                    icon={BookOpen}
                    iconColor="#ABD2FA"
                    subtext="Processed course notes"
                  />
                </div>

                {/* Sub-Navigation Tabs */}
                <div role="tablist" className="flex border-b border-brand-neutral/20 gap-2 overflow-x-auto pb-0.5">
                  {[
                    { key: "overview", label: "Overview", icon: BarChart3 },
                    { key: "quizzes", label: `Quizzes (${activeReport.recentQuizzes?.length ?? 0})`, icon: Award },
                    { key: "sessions", label: `Sessions (${activeReport.recentSessions?.length ?? 0})`, icon: Clock },
                    { key: "tasks", label: `Tasks (${activeReport.recentTasks?.length ?? 0})`, icon: ListTodo },
                    { key: "materials", label: `Library (${activeReport.materialsTotal ?? activeReport.materialsStudied?.length ?? 0})`, icon: BookOpen },
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
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                          active
                            ? "border-brand-neutral/40 text-brand-neutral"
                            : "border-transparent text-brand-muted hover:text-brand-neutral"
                        }`}
                      >
                        <Icon size={13} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab 1: Overview */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recent Quizzes Snapshot */}
                    <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                      <h3 className="text-xs font-semibold text-brand-neutral mb-3 flex items-center gap-1.5">
                        <Award size={14} className="text-brand-neutral" /> Recent Quizzes
                      </h3>
                      {activeReport.recentQuizzes && activeReport.recentQuizzes.length > 0 ? (
                        <div className="space-y-2">
                          {activeReport.recentQuizzes.slice(0, 4).map((q) => (
                            <div key={q.id} className="flex items-center justify-between p-2.5 rounded-lg bg-brand-raised border border-brand-neutral/20 text-xs">
                              <div className="min-w-0 flex-1 mr-2">
                                <span className="font-medium text-brand-neutral block truncate">{q.title}</span>
                                <span className="text-[11px] text-brand-muted">{new Date(q.submittedAt).toLocaleDateString()}</span>
                              </div>
                              <span
                                className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                                  q.accuracyPercent >= 70 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                }`}
                              >
                                {q.score}/{q.total} ({q.accuracyPercent}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-brand-muted">No quizzes taken yet.</p>
                      )}
                    </div>

                    {/* Recent Focus Sessions Snapshot */}
                    <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                      <h3 className="text-xs font-semibold text-brand-neutral mb-3 flex items-center gap-1.5">
                        <Clock size={14} className="text-emerald-400" /> Recent Study Sessions
                      </h3>
                      {activeReport.recentSessions && activeReport.recentSessions.length > 0 ? (
                        <div className="space-y-2">
                          {activeReport.recentSessions.slice(0, 4).map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-brand-raised border border-brand-neutral/20 text-xs">
                              <div className="min-w-0 flex-1 mr-2">
                                <span className="font-medium text-brand-neutral block truncate">{s.title || "Study Session"}</span>
                                <span className="text-[11px] text-brand-muted">{new Date(s.startedAt).toLocaleDateString()}</span>
                              </div>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-accent/20 text-brand-neutral font-medium">
                                {formatDuration(s.durationMinutes)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-brand-muted">No study sessions logged yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: Quizzes */}
                {activeTab === "quizzes" && (
                  <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                    <h3 className="text-xs font-semibold text-brand-neutral mb-3">Quiz History & Accuracy</h3>
                    {activeReport.recentQuizzes && activeReport.recentQuizzes.length > 0 ? (
                      <div className="space-y-2">
                        {activeReport.recentQuizzes.map((q) => (
                          <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-raised border border-brand-neutral/20 text-xs">
                            <div>
                              <span className="font-medium text-brand-neutral block">{q.title}</span>
                              <span className="text-[11px] text-brand-muted">Completed {new Date(q.submittedAt).toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-bold font-mono ${q.accuracyPercent >= 70 ? "text-emerald-400" : "text-rose-400"}`}>
                                {q.score} / {q.total}
                              </span>
                              <span className="block text-[11px] text-brand-muted">{q.accuracyPercent}% Accuracy</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-muted">No quizzes completed yet.</p>
                    )}
                  </div>
                )}

                {/* Tab 3: Sessions */}
                {activeTab === "sessions" && (
                  <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                    <h3 className="text-xs font-semibold text-brand-neutral mb-3">Study Sessions</h3>
                    {activeReport.recentSessions && activeReport.recentSessions.length > 0 ? (
                      <div className="space-y-2">
                        {activeReport.recentSessions.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-raised border border-brand-neutral/20 text-xs">
                            <div>
                              <span className="font-medium text-brand-neutral block">{s.title || "Study Session"}</span>
                              <span className="text-[11px] text-brand-muted">{new Date(s.startedAt).toLocaleString()}</span>
                            </div>
                            <span className="text-xs font-mono font-semibold text-brand-neutral">
                              {formatDuration(s.durationMinutes)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-muted">No study sessions recorded yet.</p>
                    )}
                  </div>
                )}

                {/* Tab 4: Tasks */}
                {activeTab === "tasks" && (
                  <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                    <h3 className="text-xs font-semibold text-brand-neutral mb-3">Scheduled Tasks</h3>
                    {activeReport.recentTasks && activeReport.recentTasks.length > 0 ? (
                      <div className="space-y-2">
                        {activeReport.recentTasks.map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-raised border border-brand-neutral/20 text-xs">
                            <div>
                              <span className={`font-medium block ${t.status === "COMPLETED" ? "line-through text-brand-muted" : "text-brand-neutral"}`}>
                                {t.title}
                              </span>
                              {t.scheduledDate && <span className="text-[11px] text-brand-muted">Target: {t.scheduledDate}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-brand-muted">{t.estimatedMinutes}m</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                t.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                              }`}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-muted">No tasks scheduled yet.</p>
                    )}
                  </div>
                )}

                {/* Tab 5: Library */}
                {activeTab === "materials" && (
                  <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                    <h3 className="text-xs font-semibold text-brand-neutral mb-3">Study Materials</h3>
                    {activeReport.materialsStudied && activeReport.materialsStudied.length > 0 ? (
                      <div className="space-y-2">
                        {activeReport.materialsStudied.map((m) => (
                          <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-raised border border-brand-neutral/20 text-xs">
                            <div className="flex items-center gap-2.5">
                              <BookOpen size={14} className="text-brand-neutral shrink-0" />
                              <div>
                                <span className="font-medium text-brand-neutral block">{m.title}</span>
                                <span className="text-[11px] text-brand-muted">Uploaded {new Date(m.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-accent/20 text-brand-neutral font-mono">
                              {m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-muted">No documents uploaded yet.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-brand-muted text-xs">
                <p>Loading student report details...</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Dialogs */}
      {linkToCancel && (
        <ConfirmDialog
          isOpen={true}
          title="Cancel Link Request?"
          description={`Are you sure you want to cancel the authorization request for ${linkToCancel.name}?`}
          confirmLabel="Cancel Request"
          danger={true}
          onConfirm={() => void executeCancelLink(linkToCancel.id)}
          onCancel={() => setLinkToCancel(null)}
        />
      )}

      {studentToDisconnect && (
        <ConfirmDialog
          isOpen={true}
          title={`Disconnect ${studentToDisconnect.name}?`}
          description="Are you sure you want to remove this student connection? You will no longer have access to their study progress until re-authorized."
          confirmLabel="Disconnect"
          danger={true}
          onConfirm={() => void executeCancelLink(studentToDisconnect.linkId)}
          onCancel={() => setStudentToDisconnect(null)}
        />
      )}
    </div>
  );
}
