"use client";

import { useCallback, useEffect, useState, useMemo, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  CheckCircle2,
  Award,
  Sparkles,
  Upload,
  ArrowRight,
  Search,
  RefreshCw,
  Trash2,
  Flame,
  AlertCircle,
  Brain,
  ListTodo,
} from "lucide-react";
import { Navbar } from "../navbar";
import {
  PageHeader,
  StatCard,
  Button,
  ConfirmDialog,
  EmptyState,
  Skeleton,
} from "@/components/ui";

type Me = { id?: number; name: string; email: string; role: string };
type ParentRequest = { id: number; parent: { name: string; email: string }; createdAt: string };
type Material = {
  id: number;
  title: string;
  fileName: string;
  status: string;
  summary?: string;
  processingError?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt?: string;
  topicsJson?: string;
};

type ProgressOverview = {
  totalStudyMinutes: number;
  completedTasks: number;
  totalTasks: number;
  taskCompletionPercent: number;
  quizAttempts: number;
  quizAccuracyPercent: number;
};

type Task = {
  id: number;
  title: string;
  subject?: string;
  estimatedMinutes?: number;
  status: string;
  priority?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [parentRequests, setParentRequests] = useState<ParentRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [overview, setOverview] = useState<ProgressOverview>({
    totalStudyMinutes: 0,
    completedTasks: 0,
    totalTasks: 0,
    taskCompletionPercent: 0,
    quizAttempts: 0,
    quizAccuracyPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [userRes, materialsRes, overviewRes, tasksRes] = await Promise.all([
        fetch(`${API}/auth/me`, { credentials: "include" }),
        fetch(`${API}/materials`, { credentials: "include" }),
        fetch(`${API}/progress/overview`, { credentials: "include" }).catch(() => null),
        fetch(`${API}/tasks`, { credentials: "include" }).catch(() => null),
      ]);

      if (userRes.status === 401) {
        router.push("/login");
        return;
      }

      if (userRes.ok) {
        const u = await userRes.json();
        setMe(u);
        if (u.role === "PARENT") {
          router.push("/parent");
          return;
        }
      }

      if (materialsRes.ok) {
        const raw = await materialsRes.json();
        const list: Material[] = Array.isArray(raw) ? raw : (raw?.content ?? []);
        setMaterials(list);
      }

      if (overviewRes && overviewRes.ok) {
        const o = await overviewRes.json();
        setOverview(o);
      }

      if (tasksRes && tasksRes.ok) {
        const t = await tasksRes.json();
        setTasks(Array.isArray(t) ? t : (t?.content ?? []));
      }

      // Check for parent link requests
      fetch(`${API}/parents/links/pending`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setParentRequests(data);
        })
        .catch(() => {});
    } catch {
      setError("Unable to connect to the Smart Study backend. Please ensure the service is running.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  // Polling for processing materials
  const hasProcessing = useMemo(() => materials.some((m) => m.status === "PROCESSING"), [materials]);
  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      fetch(`${API}/materials`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((raw) => {
          if (raw) {
            const list: Material[] = Array.isArray(raw) ? raw : (raw?.content ?? []);
            setMaterials(list);
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [hasProcessing]);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/materials`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "Upload failed.");
      setMaterials((curr) => [data as Material, ...curr]);
      setTimeout(() => void loadData(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document upload failed.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function confirmDeleteMaterial() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API}/materials/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Could not delete this material.");
      setMaterials((curr) => curr.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete material.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function retryMaterial(id: number) {
    setError("");
    try {
      const res = await fetch(`${API}/materials/${id}/process`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Retry request failed.");
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry processing failed.");
    }
  }

  async function acceptParentRequest(id: number) {
    try {
      const res = await fetch(`${API}/parents/links/${id}/accept`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Could not approve this link request.");
      setParentRequests((curr) => curr.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept parent link.");
    }
  }

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    const q = searchQuery.toLowerCase();
    return materials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.fileName.toLowerCase().includes(q) ||
        (m.summary && m.summary.toLowerCase().includes(q))
    );
  }, [materials, searchQuery]);

  const nextTask = useMemo(() => tasks.find((t) => t.status === "PENDING"), [tasks]);
  const userDisplayName = me?.name ? me.name : "Student";
  const studyHoursDisplay =
    overview.totalStudyMinutes >= 60
      ? `${(overview.totalStudyMinutes / 60).toFixed(1)} hrs`
      : `${overview.totalStudyMinutes} mins`;

  return (
    <div className="min-h-screen flex flex-col bg-brand-primary text-brand-light">
      <Navbar />

      <main id="main-content" className="app-container page-wrapper flex-1">
        {/* Unified Page Header */}
        <PageHeader
          eyebrow="Academic Dashboard"
          title={`Welcome back, ${userDisplayName}.`}
          description="Track your verified study time, active recall practice, and document library."
          actions={
            <label className="button primary cursor-pointer">
              <Upload size={15} />
              <span>{busy ? "Uploading Note..." : "Upload Note"}</span>
              <input
                type="file"
                accept=".pdf,.txt,.docx,.md,.xlsx,.xlsm,.pptx,.csv"
                onChange={handleUpload}
                disabled={busy}
                hidden
              />
            </label>
          }
        />

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs mb-6"
          >
            {error}
          </div>
        )}

        {/* Parent Requests Notice */}
        {parentRequests.length > 0 && (
          <div className="rounded-xl border border-brand-neutral/30 bg-brand-accent/20 p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong className="text-sm text-brand-light block">
                Parent Access Request Pending
              </strong>
              <p className="text-xs text-brand-neutral mt-0.5">
                {parentRequests[0].parent.name} ({parentRequests[0].parent.email}) requested permission to view study hours and quiz scores.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void acceptParentRequest(parentRequests[0].id)}
            >
              Approve Access
            </Button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Study Time"
            value={studyHoursDisplay}
            subtext="Across focus sessions"
            icon={Clock}
          />
          <StatCard
            label="Tasks Completed"
            value={`${overview.completedTasks} / ${overview.totalTasks}`}
            subtext={`${overview.taskCompletionPercent}% completion`}
            progressPercent={overview.taskCompletionPercent}
            icon={CheckCircle2}
          />
          <StatCard
            label="Quiz Accuracy"
            value={`${overview.quizAccuracyPercent}%`}
            subtext={`Across ${overview.quizAttempts} attempts`}
            icon={Award}
          />
          <StatCard
            label="Study Materials"
            value={materials.length}
            subtext={`${materials.filter((m) => m.status === "COMPLETED").length} ready for Q&A`}
            icon={FileText}
          />
        </div>

        {/* Quick Study Navigation & Today's Recommendation Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
          {/* Today's Recommendation */}
          <div className="lg:col-span-8 rounded-xl border border-brand-neutral/20 bg-brand-secondary p-5 flex flex-col justify-between">
            <div>
              <span className="eyebrow text-brand-neutral">
                <Flame size={13} /> Recommended Next Step
              </span>
              {nextTask ? (
                <>
                  <h3 className="text-lg font-semibold text-brand-light my-1">
                    {nextTask.title}
                  </h3>
                  <p className="text-xs text-brand-neutral leading-relaxed mb-4">
                    Estimated duration: <strong className="text-brand-neutral">{nextTask.estimatedMinutes ?? 25} minutes</strong>. Ready for a distraction-free Pomodoro session?
                  </p>
                </>
              ) : materials.length > 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-brand-light my-1">
                    All scheduled tasks completed!
                  </h3>
                  <p className="text-xs text-brand-neutral leading-relaxed mb-4">
                    Reinforce your retention with an active recall quiz generated from your uploaded materials.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-brand-light my-1">
                    Upload your first study document
                  </h3>
                  <p className="text-xs text-brand-neutral leading-relaxed mb-4">
                    Add a PDF, lecture deck, or spreadsheet to generate grounded summaries and recall quizzes.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-brand-neutral/20">
              {nextTask ? (
                <Button variant="primary" href="/focus" size="sm">
                  <Clock size={14} className="mr-1" /> Launch Focus Block
                </Button>
              ) : materials.length > 0 ? (
                <Button variant="primary" href="/quizzes" size="sm">
                  <Award size={14} className="mr-1" /> Practice Recall Quiz
                </Button>
              ) : (
                <label className="button primary btn-compact cursor-pointer">
                  <Upload size={14} />
                  <span>Upload File</span>
                  <input type="file" accept=".pdf,.txt,.docx" onChange={handleUpload} hidden />
                </label>
              )}
              <Button variant="ghost" href="/ai-tutor" size="sm">
                <Brain size={14} className="mr-1" /> Open AI Tutor
              </Button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="lg:col-span-4 rounded-xl border border-brand-neutral/20 bg-brand-secondary p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-neutral uppercase tracking-wider block mb-3">
              Study Modules
            </span>

            <div className="space-y-1.5 flex-1">
              <Link
                href="/ai-tutor"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-brand-secondary/50 text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Brain size={15} className="text-brand-neutral" />
                  <span className="font-medium text-brand-neutral">AI Tutor (Grounded)</span>
                </div>
                <ArrowRight size={13} className="text-brand-muted" />
              </Link>

              <Link
                href="/quizzes"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-brand-secondary/50 text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Award size={15} className="text-amber-400" />
                  <span className="font-medium text-brand-neutral">Active Recall Quizzes</span>
                </div>
                <ArrowRight size={13} className="text-brand-muted" />
              </Link>

              <Link
                href="/focus"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-brand-secondary/50 text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Clock size={15} className="text-emerald-400" />
                  <span className="font-medium text-brand-neutral">Pomodoro Focus Timer</span>
                </div>
                <ArrowRight size={13} className="text-brand-muted" />
              </Link>

              <Link
                href="/tasks"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-brand-secondary/50 text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ListTodo size={15} className="text-brand-neutral" />
                  <span className="font-medium text-brand-neutral">Study Tasks</span>
                </div>
                <ArrowRight size={13} className="text-brand-muted" />
              </Link>
            </div>
          </div>
        </div>

        {/* Study Materials Knowledge Library */}
        <section id="materials" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-brand-light">
                Uploaded Materials ({materials.length})
              </h2>
              <p className="text-xs text-brand-neutral">
                Files indexed in local ChromaDB vector store for grounded Q&amp;A.
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"
              />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs bg-brand-primary border border-brand-neutral/20 rounded-md text-brand-neutral placeholder-zinc-500 focus:outline-none focus:border-brand-neutral/30"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton height="72px" />
              <Skeleton height="72px" />
              <Skeleton height="72px" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            materials.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No study materials uploaded yet"
                description="Upload lecture slides, textbooks, or notes (PDF, DOCX, XLSX, PPTX, TXT) to generate AI summaries and practice quizzes."
                action={
                  <label className="button primary btn-compact cursor-pointer">
                    <Upload size={14} />
                    <span>Upload First Note</span>
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx,.md,.xlsx,.xlsm,.pptx,.csv"
                      onChange={handleUpload}
                      hidden
                    />
                  </label>
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No matching materials found"
                description={`No uploaded files matched your search "${searchQuery}".`}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                }
              />
            )
          ) : (
            <div className="space-y-2.5">
              {filteredMaterials.map((material) => {
                const ext = material.fileName.split(".").pop()?.toUpperCase() || "DOC";
                const isCompleted = material.status === "COMPLETED";
                const isProcessing = material.status === "PROCESSING";
                const isFailed = material.status === "FAILED";

                return (
                  <article
                    key={material.id}
                    className="rounded-xl border border-brand-neutral/20 bg-brand-secondary p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-brand-neutral/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="grid w-9 h-9 place-items-center rounded-lg bg-brand-primary border border-brand-neutral/20 text-[11px] font-mono font-semibold text-brand-neutral shrink-0">
                        {ext}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-brand-neutral truncate">
                            {material.title}
                          </h3>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              isCompleted
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isProcessing
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {material.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-brand-neutral mt-1">
                          <span className="truncate">{material.fileName}</span>
                          {material.fileSize && (
                            <>
                              <span>·</span>
                              <span>{(material.fileSize / 1024).toFixed(0)} KB</span>
                            </>
                          )}
                        </div>

                        {material.summary && (
                          <p className="text-xs text-brand-neutral line-clamp-1 mt-1.5 italic">
                            &ldquo;{material.summary.slice(0, 140)}...&rdquo;
                          </p>
                        )}

                        {isFailed && (
                          <div className="text-xs text-red-400 mt-1 flex items-center gap-1.5">
                            <AlertCircle size={12} />
                            <span>{material.processingError || "Extraction failed."}</span>
                            <button
                              onClick={() => void retryMaterial(material.id)}
                              className="underline text-brand-neutral hover:text-brand-light ml-1 cursor-pointer"
                            >
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isCompleted && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            href={`/ai-tutor`}
                            className="text-xs"
                          >
                            <Brain size={13} className="mr-1 text-brand-neutral" />
                            <span>Ask Tutor</span>
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            href={`/quizzes`}
                            className="text-xs"
                          >
                            <Award size={13} className="mr-1 text-amber-400" />
                            <span>Quiz</span>
                          </Button>
                        </>
                      )}

                      <button
                        onClick={() => setDeleteTarget(material)}
                        className="p-1.5 rounded text-brand-muted hover:text-red-400 hover:bg-brand-secondary transition-colors cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete Study Material?"
          description={`Are you sure you want to remove "${deleteTarget?.title}"? Its extracted chunks and ChromaDB vector embeddings will be permanently removed.`}
          confirmLabel="Delete Material"
          danger={true}
          loading={isDeleting}
          onConfirm={confirmDeleteMaterial}
          onCancel={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
}
