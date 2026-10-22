"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Award,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  Layers,
  HelpCircle,
  Check,
  Clock,
  Trash2,
} from "lucide-react";
import { demoQuizResult, demoQuizzes } from "../../demo-data";
import { Navbar } from "../../navbar";
import { PageHeader, Button, ConfirmDialog } from "@/components/ui";

type Question = {
  question: string;
  options: string[];
  explanation: string;
  difficulty: string;
  source_reference: string;
  correctAnswer?: string;
  answer?: string;
};

type Quiz = {
  id: number;
  title: string;
  questions: Question[];
  createdAt?: string;
};

type ResultItem = {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
  sourceReference: string;
};

type Result = {
  score: number;
  total: number;
  accuracyPercent: number;
  results: ResultItem[];
  notice?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function QuizDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`${API}/quizzes/${id}`, { credentials: "include" });
      if (response.status === 401 || response.status === 403) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error("Could not load this quiz from backend.");
      }
      const data = await response.json();
      setQuiz(data as Quiz);
      setAnswers(Array(data.questions?.length || 0).fill(""));
    } catch {
      setDemoMode(true);
      if (typeof window !== "undefined") {
        const custom = sessionStorage.getItem("custom_demo_quiz");
        if (custom) {
          try {
            const parsed = JSON.parse(custom);
            if (String(parsed.id) === String(id) || id === "9999") {
              setQuiz(parsed as Quiz);
              setAnswers(Array(parsed.questions.length).fill(""));
              return;
            }
          } catch {}
        }
      }
      const found = demoQuizzes.find((q) => String(q.id) === String(id)) ?? demoQuizzes[0];
      setQuiz(found as unknown as Quiz);
      setAnswers(Array(found.questions.length).fill(""));
    }
  }, [id, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function submit() {
    if (!quiz) return;
    setBusy(true);
    setError("");

    try {
      if (demoMode) {
        const demoQuestions = quiz.questions.map((q) => ({
          ...q,
          correctAnswer: q.correctAnswer ?? q.answer ?? q.options[0],
        }));
        setResult(demoQuizResult(demoQuestions, answers));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const response = await fetch(`${API}/quizzes/${id}/attempts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not submit this quiz attempt.");
      }
      setResult(data as Result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not submit this quiz.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteThisQuiz() {
    setBusy(true);
    setError("");
    try {
      if (!demoMode && id) {
        const response = await fetch(`${API}/quizzes/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!response.ok) {
          const res = await response.json().catch(() => ({}));
          throw new Error(res.error || res.message || "Failed to delete quiz.");
        }
      }
      setShowDeleteModal(false);
      router.push("/quizzes");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete quiz.");
      setBusy(false);
    }
  }

  function handleRetake() {
    if (!quiz) return;
    setAnswers(Array(quiz.questions.length).fill(""));
    setResult(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const answeredCount = answers.filter((a) => a.trim() !== "").length;
  const totalCount = quiz?.questions.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-brand-primary text-brand-neutral">
      <Navbar />

      <main id="main-content" className="app-container page-wrapper flex-1 py-8">
        <PageHeader
          backHref="/quizzes"
          backLabel="All Quizzes"
          eyebrow="Active Recall Assessment"
          eyebrowIcon={<Sparkles size={13} className="text-brand-neutral" />}
          title={quiz?.title ?? "Practice Quiz Round"}
          description="Select the most accurate answer. Detailed conceptual rationale and citations are revealed upon evaluation."
          actions={
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              disabled={busy}
              icon={<Trash2 size={13} />}
              className="text-xs"
            >
              Delete
            </Button>
          }
        />

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs font-medium mb-6"
          >
            <span>{error}</span>
          </div>
        )}

        {/* ===================== VIEW 1: RESULTS VIEW ===================== */}
        {result ? (
          <section className="animate-fade-in space-y-6">
            {/* Scorecard Hero Banner */}
            <div className="p-6 rounded-xl bg-brand-secondary border border-brand-neutral/20 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  <Award size={14} /> Evaluation Completed
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-brand-light">{result.score}</span>
                  <span className="text-lg text-brand-neutral font-medium">/ {result.total} Correct</span>
                </div>
                <p className="mt-2 text-xs text-brand-neutral">
                  {result.accuracyPercent >= 80
                    ? "Outstanding mastery of the subject matter."
                    : result.accuracyPercent >= 50
                    ? "Solid performance. Review incorrect items below to cement recall."
                    : "Revision recommended. Review the explanations below to reinforce concepts."}
                </p>
                {result.notice && <p className="text-[11px] text-brand-muted mt-1">{result.notice}</p>}
              </div>

              {/* Accuracy Badge */}
              <div className="w-24 h-24 rounded-full border-4 border-brand-neutral/25 border-t-emerald-400 border-r-emerald-400 flex flex-col items-center justify-center shrink-0 bg-brand-raised">
                <span className="text-2xl font-bold text-emerald-400">{result.accuracyPercent}%</span>
                <span className="text-[10px] text-brand-muted uppercase tracking-wider">Accuracy</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="primary"
                onClick={handleRetake}
                icon={<RotateCw size={14} />}
                className="text-xs"
              >
                Retake Quiz
              </Button>
              <Link href="/ai-tutor">
                <Button variant="secondary" icon={<Sparkles size={14} />} className="text-xs">
                  Ask AI Tutor
                </Button>
              </Link>
              <Link href="/quizzes">
                <Button variant="ghost" icon={<ArrowLeft size={14} />} className="text-xs">
                  All Quizzes
                </Button>
              </Link>
            </div>

            {/* Explanations Header */}
            <div className="pt-4 border-t border-brand-neutral/20">
              <h2 className="text-base font-semibold text-brand-light">Question Explanations & Answers</h2>
              <p className="text-xs text-brand-neutral mt-0.5">Detailed breakdown with source citations</p>
            </div>

            {/* Question Breakdown List */}
            <div className="space-y-4">
              {result.results.map((item, idx) => {
                const isCorrect = item.correct;
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-xl border transition-colors ${
                      isCorrect
                        ? "bg-brand-secondary border-emerald-500/20"
                        : "bg-brand-secondary border-rose-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono text-brand-muted">QUESTION {idx + 1}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                          isCorrect
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 size={13} /> Correct (+1)
                          </>
                        ) : (
                          <>
                            <XCircle size={13} /> Incorrect
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-brand-light mb-3 leading-snug">
                      {item.question}
                    </h3>

                    {/* Answers Comparison */}
                    <div className="p-3 rounded-lg bg-brand-raised border border-brand-neutral/25 mb-3 space-y-1.5 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-brand-muted w-24 shrink-0">Your answer:</span>
                        <span className={isCorrect ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                          {item.selectedAnswer || "(No answer selected)"}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="flex items-start gap-2">
                          <span className="text-brand-muted w-24 shrink-0">Correct answer:</span>
                          <span className="text-emerald-400 font-medium">{item.correctAnswer}</span>
                        </div>
                      )}
                    </div>

                    {/* Rationale */}
                    <div className="text-xs text-brand-neutral leading-relaxed mb-2.5">
                      <span className="text-brand-muted font-semibold block mb-1">Explanation:</span>
                      {item.explanation}
                    </div>

                    {item.sourceReference && (
                      <p className="text-[11px] text-brand-muted flex items-center gap-1.5 pt-2 border-t border-brand-neutral/20">
                        <BookOpen size={12} className="text-brand-neutral" />
                        <span>Source Reference: {item.sourceReference}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          /* ===================== VIEW 2: TAKING QUIZ VIEW ===================== */
          <section className="space-y-6">
            {/* Progress indicator */}
            {totalCount > 0 && (
              <div className="p-4 rounded-xl bg-brand-secondary border border-brand-neutral/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand-neutral">
                    {answeredCount} of {totalCount} Answered
                  </span>
                  <span className="text-xs text-brand-muted">({progressPercent}%)</span>
                </div>

                <div className="flex-1 max-w-xs h-1.5 rounded-full bg-brand-raised overflow-hidden">
                  <div
                    className="h-full bg-brand-accent rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Questions list */}
            <div className="space-y-4">
              {quiz?.questions.map((question, qIdx) => {
                const isAnswered = Boolean(answers[qIdx]);
                return (
                  <div
                    key={qIdx}
                    className={`p-5 sm:p-6 rounded-xl bg-brand-secondary border transition-colors ${
                      isAnswered ? "border-brand-neutral/30" : "border-brand-neutral/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-mono text-brand-muted uppercase tracking-wider">
                        Question {qIdx + 1} of {quiz.questions.length}
                      </span>
                      {question.difficulty && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-brand-raised border border-brand-neutral/25 text-brand-neutral">
                          {question.difficulty}
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm sm:text-base font-semibold text-brand-light mb-4 leading-snug">
                      {question.question}
                    </h2>

                    {/* Options */}
                    <div className="space-y-2 mb-3">
                      {question.options.map((option, optIdx) => {
                        const isSelected = answers[qIdx] === option;
                        const optionLetter = OPTION_LETTERS[optIdx] ?? String(optIdx + 1);

                        return (
                          <div
                            key={optIdx}
                            onClick={() => {
                              setAnswers((curr) => {
                                const next = [...curr];
                                next[qIdx] = option;
                                return next;
                              });
                            }}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                              isSelected
                                ? "bg-brand-accent/20 border-brand-neutral/50 text-brand-light shadow-sm"
                                : "bg-brand-raised border-brand-neutral/20 text-brand-neutral hover:border-brand-neutral/40 hover:bg-brand-raised"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-brand-accent text-brand-light"
                                  : "bg-brand-elevated text-brand-neutral"
                              }`}
                            >
                              {optionLetter}
                            </span>
                            <span className="text-xs sm:text-sm flex-1 leading-snug">{option}</span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-brand-neutral/40 bg-brand-accent text-brand-light"
                                  : "border-brand-neutral/30 bg-transparent"
                              }`}
                            >
                              {isSelected && <Check size={10} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {question.source_reference && (
                      <p className="text-[11px] text-brand-muted flex items-center gap-1.5 pt-2 border-t border-brand-neutral/20">
                        <BookOpen size={12} className="text-brand-neutral" />
                        <span>Reference: {question.source_reference}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Action Card */}
            {quiz && (
              <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-brand-neutral">Ready to complete your round?</h3>
                  <p className="text-xs text-brand-neutral mt-0.5">
                    {answeredCount === totalCount
                      ? "All questions answered. Submit to compute score and review explanations."
                      : `${totalCount - answeredCount} question(s) remaining. You can submit now or finish answering.`}
                  </p>
                </div>

                <Button
                  id="submit-quiz-btn"
                  variant="primary"
                  onClick={() => void submit()}
                  disabled={busy}
                  loading={busy}
                  icon={<ArrowRight size={14} />}
                  className="text-xs py-2 px-5"
                >
                  {busy ? "Evaluating..." : "Submit Quiz"}
                </Button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Delete Practice Quiz?"
        description={`Are you sure you want to delete "${quiz?.title || "this quiz"}"? All associated questions and attempts will be permanently removed.`}
        confirmLabel="Delete"
        danger={true}
        loading={busy}
        onConfirm={handleDeleteThisQuiz}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
