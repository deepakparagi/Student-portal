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
  FileCheck,
  Brain,
  ListTodo,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "../navbar";
import {
  PageHeader,
  StatCard,
  Button,
  ConfirmDialog,
  EmptyState,
  Skeleton,
  MarkdownView,
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
        const user = (await userRes.json()) as Me;
        setMe(user);
        if (user.role === "ADMIN") {
          router.push("/admin");
          return;
        }
        if (user.role === "PARENT") {
          router.push("/parent");
          return;
        }

        // Fetch parent link requests
        const requestsRes = await fetch(`${API}/parents/links/pending`, { credentials: "include" }).catch(() => null);
        if (requestsRes && requestsRes.ok) {
          const raw = await requestsRes.json();
          setParentRequests(Array.isArray(raw) ? raw : (raw?.content ?? []));
        }
      }

      if (materialsRes.ok) {
        const rawMaterials = await materialsRes.json();
        const list: Material[] = Array.isArray(rawMaterials) ? rawMaterials : (rawMaterials?.content ?? []);
        setMaterials(list);
      }

      if (overviewRes && overviewRes.ok) {
        const stats = await overviewRes.json();
        setOverview(stats);
      }

      if (tasksRes && tasksRes.ok) {
        const rawTasks = await tasksRes.json();
        const list: Task[] = Array.isArray(rawTasks) ? rawTasks : (rawTasks?.content ?? []);
        setTasks(list);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard records.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
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

  // Duplicate detection
  const duplicateTitles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of materials) {
      const t = m.title.trim().toLowerCase();
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    const dups = new Set<string>();
    counts.forEach((val, key) => {
      if (val > 1) dups.add(key);
    });
    return dups;
  }, [materials]);

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

  // Next pending task
  const nextTask = useMemo(() => tasks.find((t) => t.status === "PENDING"), [tasks]);

  const userDisplayName = me?.name ? me.name : "Student";
  const studyHoursDisplay =
    overview.totalStudyMinutes >= 60
      ? `${(overview.totalStudyMinutes / 60).toFixed(1)} hrs`
      : `${overview.totalStudyMinutes} mins`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main id="main-content" className="app-container page-wrapper" style={{ flex: 1 }}>
        {/* Unified Page Header */}
        <PageHeader
          eyebrow="Academic Dashboard"
          eyebrowIcon={<Sparkles size={13} color="var(--accent-lime)" />}
          title={`Welcome back, ${userDisplayName}.`}
          description="Here is your verified study volume, upcoming review blocks, and knowledge library."
          actions={
            <label className="button primary" style={{ cursor: "pointer" }}>
              <Upload size={16} />
              <span>{busy ? "Uploading Note..." : "Upload New Note"}</span>
              <input
                type="file"
                accept=".pdf,.txt,.docx,.md"
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
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              color: "#fca5a5",
              fontSize: "13px",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {/* Pending Parent Requests Notice */}
        {parentRequests.length > 0 && (
          <div
            className="glass-panel"
            style={{
              padding: "16px 20px",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              background: "rgba(59, 130, 246, 0.1)",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <strong style={{ color: "#93c5fd", fontSize: "14px", display: "block" }}>
                Parent Access Request Pending
              </strong>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--paper)" }}>
                {parentRequests[0].parent.name} ({parentRequests[0].parent.email}) requested permission to view your study hours and quiz scores.
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

        {/* 4 Standardized Metric Cards (Synchronized with /analytics) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <StatCard
            label="Total Study Time"
            value={studyHoursDisplay}
            subtext="Tracked across verified focus intervals"
            icon={Clock}
            iconColor="var(--mint)"
            accentColor="var(--accent-lime)"
          />
          <StatCard
            label="Tasks Completed"
            value={`${overview.completedTasks} / ${overview.totalTasks}`}
            subtext={`${overview.taskCompletionPercent}% overall plan completion`}
            progressPercent={overview.taskCompletionPercent}
            icon={CheckCircle2}
            iconColor="var(--mint)"
          />
          <StatCard
            label="Quiz Accuracy"
            value={`${overview.quizAccuracyPercent}%`}
            subtext={`Evaluated across ${overview.quizAttempts} quiz submissions`}
            icon={Award}
            iconColor="var(--gold)"
            accentColor={overview.quizAccuracyPercent >= 70 ? "var(--mint)" : "var(--paper)"}
          />
          <StatCard
            label="Knowledge Library"
            value={materials.length}
            subtext={`${materials.filter((m) => m.status === "COMPLETED").length} documents synthesized`}
            icon={FileText}
            iconColor="var(--blue)"
          />
        </div>

        {/* State-Aware "Today's Focus" Banner */}
        <div
          className="glass-panel"
          style={{
            padding: "24px 28px",
            borderRadius: "var(--radius-lg)",
            marginBottom: "28px",
            background: "linear-gradient(135deg, rgba(30, 68, 48, 0.7), rgba(8, 20, 14, 0.85))",
            border: "1px solid rgba(122, 255, 135, 0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ maxWidth: "680px" }}>
            <span className="eyebrow" style={{ color: "var(--accent-lime)" }}>
              <Flame size={14} /> Today&apos;s Focus Recommendation
            </span>
            {nextTask ? (
              <>
                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "6px 0", color: "var(--paper)" }}>
                  {nextTask.title}
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--paper-soft)" }}>
                  Scheduled duration: <strong>{nextTask.estimatedMinutes ?? 25} minutes</strong>. Ready to enter a distraction-free Pomodoro session?
                </p>
              </>
            ) : materials.length > 0 ? (
              <>
                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "6px 0", color: "var(--paper)" }}>
                  All scheduled tasks cleared!
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--paper-soft)" }}>
                  Reinforce your memory by generating an active recall quiz from your knowledge library.
                </p>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "6px 0", color: "var(--paper)" }}>
                  Upload your first study material
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--paper-soft)" }}>
                  Add a PDF, lecture slide deck, or text note to generate adaptive summaries, tasks, and quizzes.
                </p>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {nextTask ? (
              <Button variant="primary" href="/focus" size="default">
                <Clock size={16} />
                <span>Launch Focus Session</span>
              </Button>
            ) : materials.length > 0 ? (
              <Button variant="primary" href="/quizzes" size="default">
                <Award size={16} />
                <span>Practice Active Recall</span>
              </Button>
            ) : (
              <label className="button primary" style={{ cursor: "pointer" }}>
                <Upload size={16} />
                <span>Upload Note</span>
                <input type="file" accept=".pdf,.txt,.docx" onChange={handleUpload} hidden />
              </label>
            )}
          </div>
        </div>

        {/* Quick Tools Grid (Replaces plain text links) */}
        <div style={{ marginBottom: "36px" }}>
          <h2 className="section-heading" style={{ fontSize: "20px", marginBottom: "14px" }}>
            Study Toolkit
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
            <Link
              href="/focus"
              className="glass-card"
              style={{ padding: "18px", display: "flex", alignItems: "flex-start", gap: "14px", textDecoration: "none" }}
            >
              <div style={{ display: "grid", width: "40px", height: "40px", placeItems: "center", borderRadius: "10px", background: "rgba(122, 255, 135, 0.12)", color: "var(--accent-lime)", flexShrink: 0 }}>
                <Clock size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "15px", color: "var(--paper)", display: "block" }}>Focus Mode</strong>
                <span style={{ fontSize: "12px", color: "var(--mist)", marginTop: "2px", display: "block" }}>
                  Countdown Pomodoro intervals &amp; session logging
                </span>
              </div>
            </Link>

            <Link
              href="/quizzes"
              className="glass-card"
              style={{ padding: "18px", display: "flex", alignItems: "flex-start", gap: "14px", textDecoration: "none" }}
            >
              <div style={{ display: "grid", width: "40px", height: "40px", placeItems: "center", borderRadius: "10px", background: "rgba(255, 214, 105, 0.12)", color: "var(--gold)", flexShrink: 0 }}>
                <Award size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "15px", color: "var(--paper)", display: "block" }}>Active Recall Quizzes</strong>
                <span style={{ fontSize: "12px", color: "var(--mist)", marginTop: "2px", display: "block" }}>
                  Source-grounded MCQs with detailed explanations
                </span>
              </div>
            </Link>

            <Link
              href="/tasks"
              className="glass-card"
              style={{ padding: "18px", display: "flex", alignItems: "flex-start", gap: "14px", textDecoration: "none" }}
            >
              <div style={{ display: "grid", width: "40px", height: "40px", placeItems: "center", borderRadius: "10px", background: "rgba(132, 229, 188, 0.12)", color: "var(--mint)", flexShrink: 0 }}>
                <ListTodo size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "15px", color: "var(--paper)", display: "block" }}>Adaptive Tasks</strong>
                <span style={{ fontSize: "12px", color: "var(--mist)", marginTop: "2px", display: "block" }}>
                  Daily study blocks prioritized by urgency
                </span>
              </div>
            </Link>

            <Link
              href="/ai-tutor"
              className="glass-card"
              style={{ padding: "18px", display: "flex", alignItems: "flex-start", gap: "14px", textDecoration: "none" }}
            >
              <div style={{ display: "grid", width: "40px", height: "40px", placeItems: "center", borderRadius: "10px", background: "rgba(168, 231, 255, 0.12)", color: "var(--blue)", flexShrink: 0 }}>
                <Brain size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "15px", color: "var(--paper)", display: "block" }}>AI Tutor Assistant</strong>
                <span style={{ fontSize: "12px", color: "var(--mist)", marginTop: "2px", display: "block" }}>
                  Source-grounded academic Q&amp;A assistance
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Study Materials Section */}
        <section id="materials">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            <div>
              <p className="eyebrow">Knowledge Ingestion</p>
              <h2 className="section-heading" style={{ fontSize: "22px", margin: 0 }}>
                Study Materials ({materials.length})
              </h2>
            </div>

            {/* Search Filter */}
            <div style={{ position: "relative", minWidth: "260px" }}>
              <Search
                size={15}
                color="var(--mist)"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search materials by title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: "36px", height: "40px", fontSize: "13px" }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Skeleton height="80px" />
              <Skeleton height="80px" />
              <Skeleton height="80px" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            materials.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No study materials uploaded yet"
                description="Upload lecture slides, textbooks, or notes (PDF, DOCX, TXT) to generate AI summaries and practice quizzes."
                action={
                  <label className="button primary" style={{ cursor: "pointer" }}>
                    <Upload size={16} />
                    <span>Upload Your First Note</span>
                    <input type="file" accept=".pdf,.txt,.docx" onChange={handleUpload} hidden />
                  </label>
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No matching materials found"
                description={`No uploaded files matched your search query "${searchQuery}".`}
                action={
                  <Button variant="ghost" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                }
              />
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredMaterials.map((material) => {
                const isDup = duplicateTitles.has(material.title.trim().toLowerCase());
                const ext = material.fileName.split(".").pop()?.toUpperCase() || "DOC";

                return (
                  <article
                    key={material.id}
                    className="glass-card"
                    style={{
                      padding: "20px",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1 }}>
                        {/* File extension badge */}
                        <div
                          style={{
                            display: "grid",
                            width: "42px",
                            height: "44px",
                            placeItems: "center",
                            borderRadius: "8px",
                            background: ext === "PDF" ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 214, 105, 0.12)",
                            border: ext === "PDF" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 214, 105, 0.3)",
                            color: ext === "PDF" ? "#fca5a5" : "var(--gold)",
                            fontWeight: 800,
                            fontSize: "11px",
                            flexShrink: 0,
                          }}
                        >
                          {ext}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--paper)" }}>
                              {material.title}
                            </h3>
                            {isDup && (
                              <span className="badge badge-warning" title="Multiple documents share this title">
                                Duplicate Title
                              </span>
                            )}
                            <span
                              className={`badge ${
                                material.status === "COMPLETED"
                                  ? "badge-success"
                                  : material.status === "FAILED"
                                  ? "badge-danger"
                                  : "badge-neutral"
                              }`}
                            >
                              {material.status}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--mist)", marginTop: "4px" }}>
                            <span>{material.fileName}</span>
                            {material.fileSize && <span>&bull; {(material.fileSize / 1024).toFixed(1)} KB</span>}
                            {material.createdAt && (
                              <span>&bull; Uploaded {new Date(material.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        {material.status === "COMPLETED" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            href={`/quizzes`}
                          >
                            <Award size={14} color="var(--gold)" />
                            <span>Practice Quiz</span>
                          </Button>
                        )}

                        {material.status === "FAILED" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => void retryMaterial(material.id)}
                          >
                            <RefreshCw size={13} />
                            <span>Retry</span>
                          </Button>
                        )}

                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setDeleteTarget(material)}
                          title="Delete study note"
                          aria-label={`Delete ${material.title}`}
                          style={{ width: "36px", height: "36px" }}
                        >
                          <Trash2 size={15} color="var(--mist)" />
                        </button>
                      </div>
                    </div>

                    {/* Properly formatted Markdown summary (clamped to 3 lines with read-more toggle) */}
                    {material.summary && (
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: "var(--radius-sm)",
                          background: "rgba(0, 0, 0, 0.25)",
                          border: "1px solid var(--line)",
                        }}
                      >
                        <MarkdownView content={material.summary} clampLines={3} allowToggle={true} />
                      </div>
                    )}

                    {material.processingError && (
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--danger-bg)",
                          border: "1px solid var(--danger-border)",
                          color: "#fca5a5",
                          fontSize: "12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>Error: {material.processingError}</span>
                        <Button variant="ghost" size="sm" onClick={() => void retryMaterial(material.id)}>
                          Retry Processing
                        </Button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Dialog for Destructive Action: Delete Material */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Study Material?"
        description={`Are you sure you want to remove "${deleteTarget?.title}"? All extracted summaries and associated generated quiz questions for this document will be permanently removed.`}
        confirmLabel="Delete Material"
        cancelLabel="Keep Material"
        danger={true}
        loading={isDeleting}
        onConfirm={confirmDeleteMaterial}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
