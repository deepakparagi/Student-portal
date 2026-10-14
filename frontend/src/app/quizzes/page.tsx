"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Sparkles,
  Upload,
  Brain,
  FileText,
  Clock,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  Calendar,
  Layers,
  HelpCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Navbar } from "../navbar";
import {
  PageHeader,
  Button,
  ConfirmDialog,
  EmptyState,
  Skeleton,
} from "@/components/ui";

type Material = {
  id: number;
  title: string;
  fileName?: string;
  fileSize?: number;
  status: string;
  createdAt?: string;
};

type Quiz = {
  id: number;
  title: string;
  materialId?: number;
  createdAt: string;
  questionCount?: number;
  bestScore?: number;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export default function QuizzesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyState, setBusyState] = useState<string | number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "material" | "quiz";
    id: number;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Topic input state
  const [topicInput, setTopicInput] = useState("");
  const [questionCount, setQuestionCount] = useState(5);

  const loadData = useCallback(async () => {
    try {
      const [materialsRes, quizzesRes] = await Promise.all([
        fetch(`${API}/materials`, { credentials: "include" }),
        fetch(`${API}/quizzes`, { credentials: "include" }),
      ]);

      if (materialsRes.status === 401 || materialsRes.status === 403) {
        router.push("/login");
        return;
      }

      if (materialsRes.ok) {
        const rawMaterials = await materialsRes.json();
        setMaterials(Array.isArray(rawMaterials) ? rawMaterials : (rawMaterials?.content ?? []));
      }

      if (quizzesRes.ok) {
        const rawQuizzes = await quizzesRes.json();
        setQuizzes(Array.isArray(rawQuizzes) ? rawQuizzes : (rawQuizzes?.content ?? []));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load quizzes and materials.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Generate quiz by custom topic
  async function generateByTopic(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formTopic = topicInput.trim();
    if (!formTopic) return;

    setBusyState("topic");
    setError("");
    setNotice("");

    try {
      const res = await fetch(`${API}/quizzes/generate-by-topic`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: formTopic, count: questionCount }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || "Quiz generation failed.");

      setNotice(`Quiz generated successfully on topic "${formTopic}"!`);
      setTopicInput("");
      if (body?.id) {
        router.push(`/quizzes/${body.id}`);
      } else {
        void loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate topic quiz.");
    } finally {
      setBusyState(null);
    }
  }

  // Generate quiz from material
  async function generateFromMaterial(materialId: number) {
    setBusyState(materialId);
    setError("");
    setNotice("");

    try {
      const res = await fetch(`${API}/quizzes/generate/${materialId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: questionCount }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || "Quiz generation failed.");

      setNotice("Active recall quiz generated from your uploaded note!");
      if (body?.id) {
        router.push(`/quizzes/${body.id}`);
      } else {
        void loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quiz generation failed.");
    } finally {
      setBusyState(null);
    }
  }

  // Upload notes and generate quiz immediately
  async function handleNotesUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setNotice("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch(`${API}/materials`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const material = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(material.message || material.error || "Upload failed.");

      setNotice(`Uploaded "${material.title}". Processing concepts for quiz generation...`);
      setMaterials((curr) => [material, ...curr]);

      // Poll until completed or trigger quiz
      setTimeout(() => {
        void loadData();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Execute deletion
  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const endpoint = deleteTarget.type === "material" ? `/materials/${deleteTarget.id}` : `/quizzes/${deleteTarget.id}`;
      const res = await fetch(`${API}${endpoint}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Could not delete ${deleteTarget.type}.`);

      if (deleteTarget.type === "material") {
        setMaterials((curr) => curr.filter((m) => m.id !== deleteTarget.id));
      } else {
        setQuizzes((curr) => curr.filter((q) => q.id !== deleteTarget.id));
      }
      setNotice(`Deleted "${deleteTarget.title}".`);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete action failed.");
    } finally {
      setIsDeleting(false);
    }
  }

  const readyMaterials = materials.filter((m) => m.status === "COMPLETED");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main id="main-content" className="app-container page-wrapper" style={{ flex: 1 }}>
        {/* Unified Page Header */}
        <PageHeader
          eyebrow="Active Recall & Assessment"
          eyebrowIcon={<Sparkles size={13} color="var(--accent-lime)" />}
          title="Practice Quizzes."
          description="Source-grounded multiple-choice evaluations generated from your notes with verified citations and rationale."
          actions={
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              icon={<Upload size={15} />}
            >
              {uploading ? "Uploading Notes..." : "Upload Notes to Quiz"}
            </Button>
          }
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleNotesUpload}
          accept=".pdf,.txt,.docx"
          style={{ display: "none" }}
        />

        {notice && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--success-bg)",
              border: "1px solid var(--success-border)",
              color: "#86efac",
              fontSize: "13px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

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
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Async Generating State Banner (Resolves dimmed button issue) */}
        {busyState && (
          <div
            role="status"
            aria-live="polite"
            className="glass-panel"
            style={{
              padding: "20px",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(122, 255, 135, 0.4)",
              background: "rgba(122, 255, 135, 0.08)",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <Loader2 size={24} className="animate-spin" color="var(--accent-lime)" />
            <div>
              <strong style={{ color: "var(--accent-lime)", fontSize: "14px", display: "block" }}>
                Synthesizing Active Recall Quiz...
              </strong>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--paper-soft)" }}>
                Extracting core definitions, structuring answer options, and verifying citations from your source context.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: AI Quiz Generator by Topic */}
        <section
          className="glass-panel"
          style={{
            padding: "24px 28px",
            borderRadius: "var(--radius-lg)",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <div>
              <span className="eyebrow" style={{ color: "var(--mint)" }}>
                Instant Generation
              </span>
              <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "4px 0", color: "var(--paper)" }}>
                Generate Quiz by Topic or Concept
              </h2>
              <p style={{ fontSize: "13px", color: "var(--mist)", margin: 0 }}>
                Enter any syllabus chapter, historical era, or scientific topic to generate custom recall questions.
              </p>
            </div>
          </div>

          <form onSubmit={generateByTopic} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 320px" }}>
              <label htmlFor="topic-input" style={{ display: "block", fontSize: "12px", color: "var(--paper)", fontWeight: 600, marginBottom: "6px" }}>
                Topic / Subject Name
              </label>
              <input
                id="topic-input"
                type="text"
                required
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g. Mitosis and Cell Division, French Revolution, Binary Search Trees..."
                className="form-control"
              />
            </div>

            <div style={{ width: "130px" }}>
              <label htmlFor="question-count-select" style={{ display: "block", fontSize: "12px", color: "var(--paper)", fontWeight: 600, marginBottom: "6px" }}>
                Questions
              </label>
              <select
                id="question-count-select"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="form-control"
              >
                <option value={3}>3 MCQs</option>
                <option value={5}>5 MCQs</option>
                <option value={10}>10 MCQs</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={busyState === "topic"}
              style={{ minHeight: "44px" }}
            >
              Generate Quiz
            </Button>
          </form>

          {/* Quick topic suggestion pills */}
          <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--mist)", fontWeight: 600 }}>Suggested:</span>
            {[
              "Operating Systems Concurrency",
              "Database Normalization",
              "TCP/IP Networking",
              "Cellular Respiration",
            ].map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setTopicInput(topic)}
                style={{
                  fontSize: "12px",
                  padding: "5px 12px",
                  borderRadius: "999px",
                  background: topicInput === topic ? "var(--accent-lime-dim)" : "rgba(255, 255, 255, 0.05)",
                  border: topicInput === topic ? "1px solid var(--accent-lime)" : "1px solid var(--line)",
                  color: topicInput === topic ? "var(--accent-lime)" : "var(--paper)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                + {topic}
              </button>
            ))}
          </div>
        </section>

        {/* Section 2: Grounded Quiz from Uploaded Materials */}
        <section style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
            <div>
              <p className="eyebrow">Document Grounded</p>
              <h2 className="section-heading" style={{ fontSize: "20px", margin: 0 }}>
                Generate from Uploaded Notes ({readyMaterials.length})
              </h2>
            </div>
            <span style={{ fontSize: "12px", color: "var(--mist)" }}>
              Directly cited from your processed materials
            </span>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Skeleton height="68px" />
              <Skeleton height="68px" />
            </div>
          ) : readyMaterials.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No processed study materials available"
              description="Upload a PDF, TXT, or DOCX note using the button above to generate source-grounded practice questions."
              action={
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Upload size={14} />}
                >
                  Upload Study Note
                </Button>
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {readyMaterials.map((mat) => (
                <article
                  key={mat.id}
                  className="glass-card"
                  style={{
                    padding: "16px 20px",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
                    <div
                      style={{
                        display: "grid",
                        width: "38px",
                        height: "38px",
                        placeItems: "center",
                        borderRadius: "8px",
                        background: "rgba(122, 255, 135, 0.12)",
                        color: "var(--accent-lime)",
                        flexShrink: 0,
                      }}
                    >
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--paper)" }}>
                        {mat.title}
                      </h3>
                      <div style={{ fontSize: "12px", color: "var(--mist)", marginTop: "2px" }}>
                        {mat.fileName || "Course Document"} &bull; Ready for active recall evaluation
                      </div>
                    </div>
                  </div>

                  {/* Clean row actions: secondary button for repeated row items */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void generateFromMaterial(mat.id)}
                      loading={busyState === mat.id}
                      icon={<Award size={14} color="var(--gold)" />}
                    >
                      Generate Quiz
                    </Button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setDeleteTarget({ type: "material", id: mat.id, title: mat.title })}
                      aria-label={`Delete ${mat.title}`}
                      style={{ width: "36px", height: "36px" }}
                    >
                      <Trash2 size={15} color="var(--mist)" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Saved Quizzes History */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
            <div>
              <p className="eyebrow">Practice Vault</p>
              <h2 className="section-heading" style={{ fontSize: "20px", margin: 0 }}>
                Saved Quizzes ({quizzes.length})
              </h2>
            </div>
            <span style={{ fontSize: "12px", color: "var(--mist)" }}>
              Take, review, and reinforce your knowledge
            </span>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Skeleton height="68px" />
              <Skeleton height="68px" />
            </div>
          ) : quizzes.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No quizzes generated yet"
              description="Generate your first quiz above by entering a topic or selecting an uploaded note."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="glass-card"
                  style={{
                    padding: "18px 20px",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "140px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                      <span className="badge badge-neutral">
                        <Calendar size={11} /> {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => setDeleteTarget({ type: "quiz", id: quiz.id, title: quiz.title })}
                        aria-label={`Delete ${quiz.title}`}
                        style={{ width: "28px", height: "28px" }}
                      >
                        <Trash2 size={13} color="var(--mist)" />
                      </button>
                    </div>

                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "var(--paper)" }}>
                      {quiz.title}
                    </h3>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "12px", color: "var(--mist)" }}>Active Recall Round</span>
                    <Button
                      variant="primary"
                      size="sm"
                      href={`/quizzes/${quiz.id}`}
                      icon={<Play size={13} />}
                    >
                      Start Quiz
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Dialog for Destructive Delete */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={deleteTarget?.type === "material" ? "Delete Study Note?" : "Delete Quiz?"}
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Confirm Delete"
        danger={true}
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
