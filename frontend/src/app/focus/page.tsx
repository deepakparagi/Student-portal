"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  X,
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
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
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

function FocusPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get("taskId") ?? "";

  const [session, setSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState<string>(initialTaskId);
  const [preset, setPreset] = useState<TimerPreset>("pomodoro25");
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [seconds, setSeconds] = useState<number>(0);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [taskSearch, setTaskSearch] = useState<string>("");
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState<boolean>(false);
  const [isConfirmFinishOpen, setIsConfirmFinishOpen] = useState<boolean>(false);

  // Target duration in seconds for countdowns
  const targetSeconds = useMemo(() => {
    if (preset === "custom") return customMinutes * 60;
    return PRESET_DURATIONS[preset];
  }, [preset, customMinutes]);

  const load = useCallback(async () => {
    try {
      const [sessRes, histRes, tasksRes] = await Promise.all([
        fetch(`${API}/focus/sessions/active`, { credentials: "include" }),
        fetch(`${API}/focus/sessions/history`, { credentials: "include" }),
        fetch(`${API}/tasks`, { credentials: "include" }),
      ]);

      if (sessRes.status === 401) {
        router.push("/login");
        return;
      }

      if (sessRes.ok) {
        const active = (await sessRes.json()) as Session | null;
        setSession(active);
        if (active) {
          setSeconds(active.durationSeconds);
          if (active.taskId) setTaskId(String(active.taskId));
        }
      }

      if (histRes.ok) {
        const h = (await histRes.json()) as Session[];
        setHistory(h);
      }

      if (tasksRes.ok) {
        const rawTasks = await tasksRes.json();
        const t = Array.isArray(rawTasks) ? rawTasks : rawTasks?.content ?? [];
        setTasks(t);
      }
    } catch {
      // Offline fallback demo
      setSession(null);
      setHistory(demoSessions as Session[]);
      setTasks(demoTasks as Task[]);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  // Timer Tick Interval
  useEffect(() => {
    if (session?.status !== "ACTIVE") return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        if (targetSeconds > 0 && next >= targetSeconds) {
          // Play chime sound
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 1.2);
          } catch {}
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.status, targetSeconds]);

  async function handleStart() {
    setBusy(true);
    setError("");
    try {
      const payload: { taskId?: number } = {};
      if (taskId) payload.taskId = Number(taskId);

      const res = await fetch(`${API}/focus/sessions/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to start session.");
      }

      const created = (await res.json()) as Session;
      setSession(created);
      setSeconds(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error starting timer.");
    } finally {
      setBusy(false);
    }
  }

  async function action(endpoint: string) {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Request failed.");
      const updated = (await res.json()) as Session;
      setSession(updated);
      setSeconds(updated.durationSeconds);
      if (updated.status === "COMPLETED") {
        setSession(null);
        setSeconds(0);
        void load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleFinishRequest() {
    if (seconds < 60) {
      setIsConfirmFinishOpen(true);
    } else {
      void action(`/focus/sessions/${session?.id}/stop`);
    }
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

  const progressPercentage = useMemo(() => {
    if (preset === "stopwatch" || targetSeconds === 0) {
      if (session?.status === "ACTIVE") return ((seconds % 60) / 60) * 100;
      return 0;
    }
    return Math.min(100, Math.round((seconds / targetSeconds) * 100));
  }, [preset, targetSeconds, seconds, session?.status]);

  const displayClock = useMemo(() => {
    if (preset !== "stopwatch" && targetSeconds > 0) {
      const remaining = Math.max(0, targetSeconds - seconds);
      return formatClock(remaining);
    }
    return formatClock(seconds);
  }, [preset, targetSeconds, seconds]);

  const validHistory = useMemo(() => {
    return history.filter((item) => item.status === "COMPLETED" && item.durationSeconds >= 60);
  }, [history]);

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
    <div className="min-h-screen flex flex-col bg-brand-primary text-brand-light">
      <Navbar />

      <main className="app-container page-wrapper flex-1">
        <PageHeader
          eyebrow="Cognitive Endurance"
          title="Focus Mode"
          description="Settle into distraction-free momentum. Choose a preset interval to train your deep work capacity."
          actions={
            <Link href="/tasks">
              <Button variant="ghost" size="sm">
                <ListTodo size={14} className="mr-1.5" />
                <span>Tasks ({pendingTasks.length})</span>
              </Button>
            </Link>
          }
        />

        {error && (
          <div role="alert" className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs mb-6">
            {error}
          </div>
        )}

        {/* Timer & Task Box Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-12">
          {/* Main Focus Timer Card */}
          <section className="lg:col-span-7 rounded-2xl border border-brand-neutral/20 bg-brand-secondary p-6 sm:p-8 flex flex-col items-center">
            {/* Timer Presets Selection */}
            {!session || session.status === "COMPLETED" ? (
              <div className="w-full mb-6">
                <div className="flex flex-wrap items-center justify-center gap-1.5">
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
                        onClick={() => setPreset(item.key as TimerPreset)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? "bg-brand-secondary text-brand-light border border-brand-neutral/30 shadow-sm"
                            : "text-brand-neutral hover:text-brand-neutral hover:bg-brand-primary border border-transparent"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {preset === "custom" && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <label htmlFor="custom-mins" className="text-xs text-brand-neutral">
                      Duration:
                    </label>
                    <input
                      id="custom-mins"
                      type="number"
                      min="1"
                      max="180"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-8 text-center rounded border border-brand-neutral/30 bg-brand-primary text-xs text-brand-light"
                    />
                    <span className="text-xs text-brand-neutral">minutes</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6 bg-brand-primary border border-brand-neutral/20">
                <span
                  className={`w-2 h-2 rounded-full ${
                    session.status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span className="text-brand-neutral">
                  {session.status === "ACTIVE" ? "Session in progress" : "Session paused"}
                </span>
              </div>
            )}

            {/* Circular Progress Timer Display */}
            <div className="my-4 relative grid place-items-center">
              <ProgressRing
                progress={progressPercentage}
                size={240}
                strokeWidth={8}
                color={preset === "break5" ? "#7692FF" : session?.status === "PAUSED" ? "#f59e0b" : "#ABD2FA"}
                bgColor="rgba(255, 255, 255, 0.05)"
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] uppercase tracking-wider text-brand-muted font-medium mb-1">
                    {preset === "stopwatch"
                      ? "Elapsed"
                      : session?.status === "ACTIVE"
                      ? "Remaining"
                      : "Ready"}
                  </span>
                  <div className="text-5xl font-semibold tracking-tight text-brand-light font-mono">
                    {displayClock}
                  </div>
                  <span className="text-xs text-brand-neutral mt-2 max-w-[160px] truncate">
                    {selectedTaskObj ? selectedTaskObj.title : "Deep Study"}
                  </span>
                </div>
              </ProgressRing>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full max-w-xs mt-4">
              {!session || session.status === "COMPLETED" ? (
                <Button
                  variant="primary"
                  size="default"
                  onClick={() => void handleStart()}
                  loading={busy}
                  className="w-full text-sm font-medium py-2.5"
                >
                  <Play size={15} fill="currentColor" className="mr-1.5" /> Start Focus Session
                </Button>
              ) : (
                <>
                  {session.status === "ACTIVE" ? (
                    <Button
                      variant="secondary"
                      size="default"
                      onClick={() => void action(`/focus/sessions/${session.id}/pause`)}
                      loading={busy}
                      className="flex-1"
                    >
                      <Pause size={15} className="mr-1.5" /> Pause
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="default"
                      onClick={() => void action(`/focus/sessions/${session.id}/resume`)}
                      loading={busy}
                      className="flex-1"
                    >
                      <Play size={15} fill="currentColor" className="mr-1.5" /> Resume
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => void handleFinishRequest()}
                    loading={busy}
                    className="flex-1 text-brand-neutral hover:text-brand-neutral"
                  >
                    <Square size={13} fill="currentColor" className="mr-1.5" /> Finish
                  </Button>
                </>
              )}
            </div>
          </section>

          {/* Right Column: Associated Study Task & Tips */}
          <section className="lg:col-span-5 space-y-4">
            {/* Task Selector Box */}
            <div className="rounded-2xl border border-brand-neutral/20 bg-brand-secondary p-5">
              <h2 className="text-sm font-semibold text-brand-neutral mb-1">
                Link to Study Task
              </h2>
              <p className="text-xs text-brand-neutral mb-3">
                Connect your session to automatically log completed task duration.
              </p>

              {selectedTaskObj ? (
                <div className="p-3 rounded-lg border border-brand-neutral/30 bg-brand-accent/20 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium text-brand-neutral block">
                      {selectedTaskObj.subject || "Active Task"}
                    </span>
                    <h3 className="text-xs font-semibold text-brand-light truncate">
                      {selectedTaskObj.title}
                    </h3>
                  </div>

                  {!session || session.status === "COMPLETED" ? (
                    <button
                      onClick={() => setTaskId("")}
                      className="p-1 rounded text-brand-neutral hover:text-brand-neutral cursor-pointer"
                      title="Clear task"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsTaskPickerOpen((p) => !p)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-brand-neutral/20 bg-brand-primary/60 text-xs text-brand-neutral hover:text-brand-neutral hover:border-brand-neutral/30 transition-colors cursor-pointer"
                >
                  <span>Select a task from schedule...</span>
                  <Search size={14} />
                </button>
              )}

              {isTaskPickerOpen && (!session || session.status === "COMPLETED") && (
                <div className="mt-3 p-3 rounded-lg border border-brand-neutral/20 bg-brand-primary space-y-2">
                  <input
                    type="text"
                    placeholder="Search pending tasks..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="w-full h-8 px-2.5 bg-brand-primary border border-brand-neutral/20 rounded text-xs text-brand-neutral placeholder-zinc-500"
                  />

                  <div className="max-h-40 overflow-y-auto space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTaskId("");
                        setIsTaskPickerOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-xs text-brand-neutral hover:text-brand-neutral hover:bg-brand-secondary cursor-pointer"
                    >
                      General Study Session (No Task)
                    </button>

                    {filteredTasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTaskId(String(t.id));
                          setIsTaskPickerOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded text-xs text-brand-neutral hover:bg-brand-secondary flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{t.title}</span>
                        {t.subject && <span className="text-[10px] text-brand-muted">{t.subject}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Focus Tips Card */}
            <div className="rounded-2xl border border-brand-neutral/20 bg-brand-secondary p-5 text-xs text-brand-neutral space-y-2">
              <h3 className="text-xs font-semibold text-brand-neutral uppercase tracking-wider">
                Focus Protocol
              </h3>
              <ul className="space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Silence phone notifications and keep water nearby.</li>
                <li>Single-task only: avoid switching tabs during the block.</li>
                <li>Sessions under 1 minute are discarded to maintain clean analytics.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* History Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-brand-neutral/20 pb-3">
            <div>
              <h2 className="text-base font-semibold text-brand-light">
                Recent Focus Sessions
              </h2>
              <p className="text-xs text-brand-neutral">
                Verified study intervals recorded in your learning ledger.
              </p>
            </div>
            <span className="text-xs text-brand-muted">
              {validHistory.length} completed session{validHistory.length === 1 ? "" : "s"}
            </span>
          </div>

          {validHistory.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No completed sessions yet"
              description="Complete a focus session of at least 1 minute to log verified study hours."
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([dayLabel, daySessions]) => (
                <div key={dayLabel} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-brand-muted">
                    <Calendar size={13} />
                    <span>{dayLabel}</span>
                  </div>

                  <div className="space-y-1.5">
                    {daySessions.map((item) => {
                      const taskObj = item.taskId
                        ? tasks.find((t) => t.id === item.taskId)
                        : null;
                      const sessionTitle = taskObj?.title ?? "General Focus Block";
                      const timeStarted = new Date(item.startedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-brand-neutral/20 bg-brand-secondary p-3 flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-brand-neutral truncate">
                                {sessionTitle}
                              </span>
                              {taskObj?.subject && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-secondary text-brand-neutral">
                                  {taskObj.subject}
                                </span>
                              )}
                            </div>
                            <span className="text-brand-muted text-[11px] mt-0.5 block">
                              Started at {timeStarted}
                            </span>
                          </div>

                          <span className="px-2.5 py-1 rounded-md bg-brand-accent/20 text-brand-neutral border border-brand-neutral/20 font-mono font-medium shrink-0">
                            {formatDurationHuman(item.durationSeconds)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Short Session Discard Dialog */}
        <ConfirmDialog
          isOpen={isConfirmFinishOpen}
          title="Discard Short Session?"
          description="This session is under 60 seconds. Sessions shorter than 1 minute are not saved to keep study telemetry accurate."
          confirmLabel="Discard & Stop"
          cancelLabel="Continue Timer"
          danger={false}
          onConfirm={() => {
            setIsConfirmFinishOpen(false);
            void action(`/focus/sessions/${session?.id}/stop`);
          }}
          onCancel={() => setIsConfirmFinishOpen(false)}
        />
      </main>
    </div>
  );
}

export default function FocusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-brand-primary text-brand-neutral">
          <Navbar />
          <main className="app-container page-wrapper flex-1 py-8 flex items-center justify-center">
            <div className="text-brand-muted text-xs">Loading focus workspace...</div>
          </main>
        </div>
      }
    >
      <FocusPageContent />
    </Suspense>
  );
}
