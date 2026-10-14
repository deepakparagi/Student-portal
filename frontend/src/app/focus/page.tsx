"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  Pause,
  Square,
  Clock,
  RotateCcw,
  ListTodo,
  CheckCircle2,
  Search,
  Sparkles,
  Coffee,
  X,
  Target,
  Calendar,
} from "lucide-react";
import { demoSessions, demoTasks } from "../demo-data";
import { Navbar } from "../navbar";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";

type Session = {
  id: number;
  taskId: number | null;
  startedAt: string;
  activeSince: string | null;
  durationSeconds: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
};

type Task = {
  id: number;
  title: string;
  status: string;
  subject?: string;
  priority?: string;
};

type TimerPreset = "pomodoro25" | "break5" | "deep45" | "extended60" | "custom" | "stopwatch";

const PRESET_DURATIONS: Record<TimerPreset, number> = {
  pomodoro25: 25 * 60,
  break5: 5 * 60,
  deep45: 45 * 60,
  extended60: 60 * 60,
  custom: 30 * 60,
  stopwatch: 0,
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDurationHuman(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} mins`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${h} hr${h > 1 ? "s" : ""}` : `${h} hr ${rem} min`;
}

function getDayGroupKey(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function FocusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get("taskId") ?? "";

  const [session, setSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState<string>(initialTaskId);
  const [seconds, setSeconds] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // Timer configuration
  const [preset, setPreset] = useState<TimerPreset>("pomodoro25");
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState<boolean>(false);
  const [taskSearch, setTaskSearch] = useState<string>("");

  // Modals & Dialogs
  const [showDiscardDialog, setShowDiscardDialog] = useState<boolean>(false);
  const [summarySession, setSummarySession] = useState<{
    duration: number;
    taskTitle: string;
  } | null>(null);

  const targetSeconds = useMemo(() => {
    if (preset === "custom") return Math.max(1, customMinutes) * 60;
    return PRESET_DURATIONS[preset];
  }, [preset, customMinutes]);

  const load = useCallback(async () => {
    try {
      const [active, past, taskResponse] = await Promise.all([
        fetch(`${API}/focus/sessions/active`, { credentials: "include" }),
        fetch(`${API}/focus/sessions`, { credentials: "include" }),
        fetch(`${API}/tasks`, { credentials: "include" }),
      ]);
      if (active.status === 401) {
        router.push("/login");
        return;
      }
      if (!active.ok || !past.ok || !taskResponse.ok) {
        throw new Error("Could not load focus sessions.");
      }
      const current = active.status === 204 ? null : ((await active.json()) as Session);
      setSession(current);
      setSeconds(current?.durationSeconds ?? 0);
      if (current?.taskId) {
        setTaskId(String(current.taskId));
      }
      const pastList = (await past.json()) as Session[];
      setHistory(pastList);
      const loadedTasks = (await taskResponse.json()) as Task[];
      setTasks(loadedTasks);
    } catch {
      setDemoMode(true);
      setSession(null);
      setSeconds(0);
      setHistory(demoSessions);
      setTasks(demoTasks);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Keep ticking while session is active
  useEffect(() => {
    if (session?.status !== "ACTIVE") return;
    const refTime = session.activeSince || session.startedAt || new Date().toISOString();
    const startMs = new Date(refTime).getTime();
    const baseSecs = session.durationSeconds ?? 0;

    const tick = () => {
      const elapsedSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setSeconds(baseSecs + elapsedSecs);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  async function action(path: string, method = "PATCH", body?: unknown) {
    setBusy(true);
    setError("");
    try {
      if (demoMode) {
        const now = new Date();
        let result: Session;
        if (path === "/focus/sessions") {
          const selected =
            body && typeof body === "object" && "taskId" in body
              ? Number((body as { taskId: number }).taskId)
              : null;
          result = {
            id: Date.now(),
            taskId: selected,
            startedAt: now.toISOString(),
            activeSince: now.toISOString(),
            durationSeconds: 0,
            status: "ACTIVE",
          };
        } else if (!session) {
          return null;
        } else {
          const elapsed =
            session.status === "ACTIVE" && session.activeSince
              ? Math.max(
                  0,
                  Math.floor((now.getTime() - new Date(session.activeSince).getTime()) / 1000)
                )
              : 0;
          const durationSeconds = session.durationSeconds + elapsed;
          result = path.endsWith("/pause")
            ? { ...session, durationSeconds, activeSince: null, status: "PAUSED" }
            : {
                ...session,
                durationSeconds,
                activeSince: path.endsWith("/resume") ? now.toISOString() : null,
                status: path.endsWith("/resume") ? "ACTIVE" : "COMPLETED",
              };
        }
        setSession(result);
        setSeconds(result.durationSeconds);
        if (result.status === "COMPLETED") {
          setHistory((current) => [result, ...current.filter((item) => item.id !== result.id)]);
        }
        return result;
      }

      const response = await fetch(`${API}${path}`, {
        method,
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || result.message || "Focus session could not be updated.");
      }
      const s = result as Session;
      setSession(s);
      setSeconds(s.durationSeconds);
      if (s.status === "COMPLETED") {
        setHistory((current) => [s, ...current.filter((item) => item.id !== s.id)]);
      }
      return s;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Focus session could not be updated.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    await action("/focus/sessions", "POST", taskId ? { taskId: Number(taskId) } : {});
  }

  async function handleFinishRequest() {
    if (!session) return;
    // Check if session is under 60 seconds (junk session prevention)
    if (seconds < 60) {
      setShowDiscardDialog(true);
      return;
    }
    await commitFinish();
  }

  async function commitFinish() {
    if (!session) return;
    const finalSecs = seconds;
    const selectedTask = tasks.find((t) => String(t.id) === taskId);
    const res = await action(`/focus/sessions/${session.id}/finish`, "POST");
    if (res) {
      setSummarySession({
        duration: finalSecs,
        taskTitle: selectedTask?.title ?? "General Focus & Study",
      });
    }
  }

  async function handleDiscardJunkSession() {
    setShowDiscardDialog(false);
    if (!session) return;
    // Discard locally and end session without saving to history
    if (!demoMode) {
      try {
        await fetch(`${API}/focus/sessions/${session.id}/finish`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // Ignored
      }
    }
    setSession(null);
    setSeconds(0);
    // Reload history to refresh clean state
    void load();
  }

  const selectedTaskObj = tasks.find((t) => String(t.id) === taskId);
  const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED");

  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return pendingTasks;
    const q = taskSearch.toLowerCase();
    return pendingTasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q)
    );
  }, [pendingTasks, taskSearch]);

  // Compute ring progress
  const progressPercentage = useMemo(() => {
    if (preset === "stopwatch" || targetSeconds === 0) {
      if (session?.status === "ACTIVE") {
        // Continuous subtle rotation feel
        return ((seconds % 60) / 60) * 100;
      }
      return 0;
    }
    return Math.min(100, Math.round((seconds / targetSeconds) * 100));
  }, [preset, targetSeconds, seconds, session?.status]);

  // Remaining time calculation for countdown presets
  const displayClock = useMemo(() => {
    if (preset !== "stopwatch" && targetSeconds > 0) {
      const remaining = Math.max(0, targetSeconds - seconds);
      return formatClock(remaining);
    }
    return formatClock(seconds);
  }, [preset, targetSeconds, seconds]);

  // Filter history: Hide sessions with duration < 60 seconds (Step 3 requirement)
  const validHistory = useMemo(() => {
    return history.filter((item) => item.status === "COMPLETED" && item.durationSeconds >= 60);
  }, [history]);

  // Group history by day
  const groupedHistory = useMemo(() => {
    const groups: Record<string, Session[]> = {};
    for (const item of validHistory) {
      const key = getDayGroupKey(item.startedAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [validHistory]);

  return (
    <>
      <Navbar />
      <main className="app-container" style={{ paddingBottom: "100px", paddingTop: "24px" }}>
        <PageHeader
          eyebrow="Deep Work & Concentration"
          title="Focus Mode"
          description="Settle into single-task momentum. Choose a science-backed preset or custom timer to train your cognitive endurance."
          actions={
            <Link href="/tasks">
              <Button variant="ghost" size="sm" icon={<ListTodo size={15} />}>
                View Tasks ({pendingTasks.length})
              </Button>
            </Link>
          }
        />

        {demoMode && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(196,255,106,0.06)",
              border: "1px solid rgba(196,255,106,0.2)",
              color: "var(--paper)",
              fontSize: "13px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Sparkles size={16} color="var(--accent-lime)" />
            <span>
              <strong>Preview mode:</strong> Sample focus sessions displayed. Connect your backend to persist timer history.
            </span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(255,107,107,0.1)",
              border: "1px solid rgba(255,107,107,0.3)",
              color: "var(--danger)",
              fontSize: "13px",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {/* Top Layout Grid: Timer Card & Task Focus Side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* Main Focus Timer Card */}
          <section
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "20px",
              padding: "32px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            }}
          >
            {/* Timer Presets Selection (Only changeable when not in active session) */}
            {!session || session.status === "COMPLETED" ? (
              <div
                style={{
                  width: "100%",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--mist)",
                    marginBottom: "10px",
                    textAlign: "center",
                  }}
                >
                  Select Timer Mode
                </div>

                <div
                  role="tablist"
                  aria-label="Timer presets"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  {[
                    { key: "pomodoro25", label: "25m Pomodoro" },
                    { key: "deep45", label: "45m Deep Work" },
                    { key: "extended60", label: "60m Extended" },
                    { key: "break5", label: "5m Break" },
                    { key: "stopwatch", label: "Stopwatch" },
                    { key: "custom", label: "Custom" },
                  ].map((item) => {
                    const active = preset === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setPreset(item.key as TimerPreset)}
                        style={{
                          minHeight: "44px",
                          minWidth: "86px",
                          padding: "8px 14px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: active ? 600 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          background: active ? "rgba(196, 255, 106, 0.12)" : "rgba(255, 255, 255, 0.03)",
                          color: active ? "var(--accent-lime)" : "var(--paper)",
                          border: active
                            ? "1px solid var(--accent-lime)"
                            : "1px solid var(--border-subtle)",
                          boxShadow: active ? "0 0 16px rgba(196, 255, 106, 0.15)" : "none",
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Minutes Input if Custom chosen */}
                {preset === "custom" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      marginTop: "16px",
                    }}
                  >
                    <label htmlFor="custom-mins-input" style={{ fontSize: "13px", color: "var(--mist)" }}>
                      Target Duration:
                    </label>
                    <input
                      id="custom-mins-input"
                      type="number"
                      min="1"
                      max="180"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: "80px",
                        height: "44px",
                        textAlign: "center",
                        borderRadius: "8px",
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--paper)",
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    />
                    <span style={{ fontSize: "13px", color: "var(--mist)" }}>minutes</span>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background:
                    session.status === "ACTIVE"
                      ? "rgba(196, 255, 106, 0.1)"
                      : "rgba(255, 204, 0, 0.1)",
                  border:
                    session.status === "ACTIVE"
                      ? "1px solid rgba(196, 255, 106, 0.3)"
                      : "1px solid rgba(255, 204, 0, 0.3)",
                  color: session.status === "ACTIVE" ? "var(--accent-lime)" : "#f6c445",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: session.status === "ACTIVE" ? "var(--accent-lime)" : "#f6c445",
                    boxShadow:
                      session.status === "ACTIVE" ? "0 0 8px var(--accent-lime)" : "none",
                  }}
                />
                {session.status === "ACTIVE" ? "Focus in progress" : "Session paused"}
              </div>
            )}

            {/* Circular Progress Timer */}
            <div
              style={{
                margin: "12px 0 24px",
                position: "relative",
                display: "grid",
                placeItems: "center",
              }}
            >
              <ProgressRing
                progress={progressPercentage}
                size={270}
                strokeWidth={10}
                color={
                  preset === "break5"
                    ? "var(--info)"
                    : session?.status === "PAUSED"
                    ? "#f6c445"
                    : "var(--accent-lime)"
                }
                bgColor="rgba(255, 255, 255, 0.05)"
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontWeight: 600,
                      color: "var(--mist)",
                      marginBottom: "4px",
                    }}
                  >
                    {preset === "stopwatch"
                      ? "Elapsed Time"
                      : session?.status === "ACTIVE"
                      ? "Remaining"
                      : "Ready"}
                  </span>

                  <div
                    aria-live="polite"
                    aria-atomic="true"
                    style={{
                      fontFamily: "var(--font-sans-family)",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "clamp(46px, 7vw, 62px)",
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                      color: "var(--paper)",
                      textShadow:
                        session?.status === "ACTIVE"
                          ? "0 0 24px rgba(196,255,106,0.35)"
                          : "none",
                    }}
                  >
                    {displayClock}
                  </div>

                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--mist)",
                      marginTop: "8px",
                      maxWidth: "180px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {selectedTaskObj ? selectedTaskObj.title : "General focus session"}
                  </span>
                </div>
              </ProgressRing>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "14px",
                width: "100%",
                maxWidth: "340px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {!session || session.status === "COMPLETED" ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => void handleStart()}
                  loading={busy}
                  icon={<Play size={18} fill="currentColor" />}
                  style={{ width: "100%", minHeight: "48px" }}
                >
                  Start Focus Session
                </Button>
              ) : (
                <>
                  {session.status === "ACTIVE" ? (
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => void action(`/focus/sessions/${session.id}/pause`)}
                      loading={busy}
                      icon={<Pause size={18} />}
                      style={{ flex: 1, minHeight: "44px" }}
                    >
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="default"
                      onClick={() => void action(`/focus/sessions/${session.id}/resume`)}
                      loading={busy}
                      icon={<Play size={18} fill="currentColor" />}
                      style={{ flex: 1, minHeight: "44px" }}
                    >
                      Resume
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="default"
                    onClick={() => void handleFinishRequest()}
                    loading={busy}
                    icon={<Square size={16} fill="currentColor" />}
                    style={{ flex: 1, minHeight: "44px" }}
                  >
                    Finish
                  </Button>
                </>
              )}
            </div>
          </section>

          {/* Right Column: Searchable Task Selection & Target Info */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Task Selector Box */}
            <div
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "20px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "17px", fontWeight: 600, margin: 0 }}>
                    Associated Study Task
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--mist)" }}>
                    Tie your session to a study task to automatically track completion.
                  </p>
                </div>
              </div>

              {/* Selected Task Card or Picker trigger */}
              {selectedTaskObj ? (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "rgba(196, 255, 106, 0.05)",
                    border: "1px solid rgba(196, 255, 106, 0.25)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: "rgba(196,255,106,0.15)",
                          color: "var(--accent-lime)",
                        }}
                      >
                        Target Task
                      </span>
                      {selectedTaskObj.subject && (
                        <span style={{ fontSize: "12px", color: "var(--mist)" }}>
                          {selectedTaskObj.subject}
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--paper)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedTaskObj.title}
                    </h3>
                  </div>

                  {!session || session.status === "COMPLETED" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTaskId("")}
                      aria-label="Remove task selection"
                      icon={<X size={15} />}
                    />
                  ) : null}
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsTaskPickerOpen((prev) => !prev)}
                    style={{
                      width: "100%",
                      minHeight: "46px",
                      padding: "0 16px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--mist)",
                      fontSize: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span>🎯 Choose a task from your schedule...</span>
                    <Search size={16} />
                  </button>
                </div>
              )}

              {/* Searchable Picker Panel */}
              {isTaskPickerOpen && (!session || session.status === "COMPLETED") && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "16px",
                    borderRadius: "14px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      marginBottom: "12px",
                    }}
                  >
                    <Search
                      size={15}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--mist)",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search pending tasks..."
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px 0 36px",
                        borderRadius: "8px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--paper)",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      maxHeight: "220px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setTaskId("");
                        setIsTaskPickerOpen(false);
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: taskId === "" ? "rgba(196,255,106,0.1)" : "transparent",
                        border: "none",
                        color: taskId === "" ? "var(--accent-lime)" : "var(--paper)",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      ✨ Open study session (No task selected)
                    </button>

                    {filteredTasks.length === 0 ? (
                      <p style={{ margin: "8px 0", fontSize: "12px", color: "var(--mist)", textAlign: "center" }}>
                        No pending tasks found.
                      </p>
                    ) : (
                      filteredTasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTaskId(String(t.id));
                            setIsTaskPickerOpen(false);
                          }}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "8px",
                            background:
                              taskId === String(t.id) ? "rgba(196,255,106,0.1)" : "transparent",
                            border: "none",
                            color: "var(--paper)",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "13px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{t.title}</span>
                          {t.subject && (
                            <span style={{ fontSize: "11px", color: "var(--mist)" }}>
                              {t.subject}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Tips / Ergonomics */}
            <div
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "20px",
                padding: "24px",
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 10px" }}>
                Focus Protocol Tips
              </h3>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "18px",
                  fontSize: "13px",
                  color: "var(--mist)",
                  lineHeight: 1.6,
                }}
              >
                <li>Silence notifications and close unrelated browser tabs.</li>
                <li>Hydrate beforehand; keep water within arm's reach.</li>
                <li>When the timer expires, step away for a genuine 5-minute break.</li>
                <li>Sessions under 1 minute are discarded to maintain clean analytics.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Practice History Section */}
        <section style={{ marginTop: "48px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <p className="eyebrow" style={{ margin: "0 0 4px" }}>
                Session Log
              </p>
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Recent Study Sessions</h2>
            </div>
            <span style={{ fontSize: "13px", color: "var(--mist)" }}>
              {validHistory.length} completed session{validHistory.length === 1 ? "" : "s"} logged
            </span>
          </div>

          {validHistory.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No finished study sessions yet"
              description="Complete your first focus block of at least 1 minute to record verified practice hours in your analytics."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {Object.entries(groupedHistory).map(([dayLabel, daySessions]) => (
                <div key={dayLabel}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <Calendar size={14} color="var(--accent-lime)" />
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--accent-lime)",
                      }}
                    >
                      {dayLabel}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: "var(--border-subtle)",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {daySessions.map((item) => {
                      const taskObj = item.taskId
                        ? tasks.find((t) => t.id === item.taskId)
                        : null;
                      const sessionTitle = taskObj?.title ?? "General Focus & Study";
                      const timeStarted = new Date(item.startedAt).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      });

                      return (
                        <article
                          key={item.id}
                          style={{
                            background: "var(--surface-1)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "14px",
                            padding: "14px 20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "16px",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <h3
                                style={{
                                  margin: 0,
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "var(--paper)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {sessionTitle}
                              </h3>
                              {taskObj?.subject && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--mist)",
                                    background: "rgba(255,255,255,0.05)",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                  }}
                                >
                                  {taskObj.subject}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "12px", color: "var(--mist)", marginTop: "2px", display: "inline-block" }}>
                              Started at {timeStarted}
                            </span>
                          </div>

                          <div
                            style={{
                              padding: "6px 14px",
                              borderRadius: "10px",
                              background: "rgba(196, 255, 106, 0.08)",
                              border: "1px solid rgba(196, 255, 106, 0.2)",
                              color: "var(--accent-lime)",
                              fontWeight: 700,
                              fontSize: "13px",
                              fontVariantNumeric: "tabular-nums",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatDurationHuman(item.durationSeconds)}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Discard Short Session Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        title="Discard Short Session?"
        description={`This session lasted only ${seconds} seconds. Focus intervals under 1 minute are discarded by default so your practice analytics and progress reports reflect meaningful study time.`}
        confirmLabel="Discard Session"
        cancelLabel="Save Anyway"
        danger={true}
        onConfirm={() => void handleDiscardJunkSession()}
        onCancel={() => {
          setShowDiscardDialog(false);
          void commitFinish();
        }}
      />

      {/* Session Completion Summary Modal */}
      {summarySession && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            padding: "20px",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--accent-lime)",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "440px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(196, 255, 106, 0.15)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
                color: "var(--accent-lime)",
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 8px" }}>
              Focus Session Completed!
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: "var(--mist)" }}>
              Excellent focus! You dedicated{" "}
              <strong style={{ color: "var(--accent-lime)" }}>
                {formatDurationHuman(summarySession.duration)}
              </strong>{" "}
              to <strong>{summarySession.taskTitle}</strong>.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <Button
                variant="primary"
                size="default"
                onClick={() => {
                  setSummarySession(null);
                  setPreset("break5");
                }}
                icon={<Coffee size={16} />}
              >
                Start 5-Minute Break
              </Button>
              <Button
                variant="secondary"
                size="default"
                onClick={() => setSummarySession(null)}
              >
                Close & Return
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
