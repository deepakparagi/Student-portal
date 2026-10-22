"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowRight,
  Flame,
  AlertTriangle,
  Brain,
  Eye,
  EyeOff,
  Play,
  Pause,
  Square,
  RefreshCw,
  Plus,
} from "lucide-react";
import { demoOverview, demoTrends } from "../demo-data";
import { Navbar } from "../navbar";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";

type Overview = {
  totalStudyMinutes: number;
  totalStudySeconds?: number;
  isFocusingNow?: boolean;
  activeSessionSeconds?: number;
  activeSessionStatus?: string;
  activeSessionId?: number;
  completedTasks: number;
  totalTasks: number;
  taskCompletionPercent: number;
  quizAttempts: number;
  quizAccuracyPercent: number;
};

type Trend = {
  studyMinutes: { date: string; minutes: number; seconds?: number }[];
  taskCompletions: { date: string; completed: number }[];
  quizAccuracy: { date: string; percent?: number; questions?: number }[];
};

type Quiz = {
  id: number;
  title: string;
  topic?: string;
  scorePercent: number | null;
  questionCount: number;
  createdAt: string;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export default function AnalyticsPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<Trend | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [error, setError] = useState<string>("");
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [activeTooltipDay, setActiveTooltipDay] = useState<string | null>(null);
  const [hideEmptyDays, setHideEmptyDays] = useState<boolean>(true);
  const [actionBusy, setActionBusy] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  const load = useCallback(async () => {
    try {
      const [overviewRes, trendRes, quizzesRes] = await Promise.all([
        fetch(`${API}/progress/overview`, { credentials: "include" }),
        fetch(`${API}/progress/trends`, { credentials: "include" }),
        fetch(`${API}/quizzes`, { credentials: "include" }),
      ]);
      if (overviewRes.status === 401) {
        router.push("/login");
        return;
      }
      if (!overviewRes.ok || !trendRes.ok) {
        throw new Error("Could not load progress data.");
      }
      const ov = (await overviewRes.json()) as Overview;
      const tr = (await trendRes.json()) as Trend;
      setOverview(ov);
      setTrend(tr);
      setLastSynced(new Date());

      if (quizzesRes.ok) {
        const qz = (await quizzesRes.json()) as Quiz[];
        setQuizzes(qz);
      }
    } catch {
      setDemoMode(true);
      setOverview(demoOverview);
      setTrend(demoTrends);
      setQuizzes([
        {
          id: 1,
          title: "Cellular Respiration & ATP",
          topic: "Cell Biology",
          scorePercent: 85,
          questionCount: 5,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: "Linear Equations & Matrices",
          topic: "Algebra",
          scorePercent: 55,
          questionCount: 5,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    }
  }, [router]);

  // Regular periodic sync every 3 seconds
  useEffect(() => {
    void load();
    const interval = setInterval(() => {
      void load();
    }, 3000);
    return () => clearInterval(interval);
  }, [load]);

  // Window visibility & focus sync
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [load]);

  // 1-second smooth ticker when session is actively focusing
  useEffect(() => {
    if (!overview?.isFocusingNow) return;
    const ticker = setInterval(() => {
      setOverview((prev) => {
        if (!prev || !prev.isFocusingNow) return prev;
        const curActive = prev.activeSessionSeconds ?? 0;
        const curTotalSecs = prev.totalStudySeconds ?? (prev.totalStudyMinutes * 60);
        const nextActive = curActive + 1;
        const nextTotalSecs = curTotalSecs + 1;
        return {
          ...prev,
          activeSessionSeconds: nextActive,
          totalStudySeconds: nextTotalSecs,
          totalStudyMinutes: Math.floor(nextTotalSecs / 60),
        };
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [overview?.isFocusingNow]);

  // Quick Session Actions directly from Analytics
  async function handleQuickStart() {
    setActionBusy(true);
    try {
      const res = await fetch(`${API}/focus/sessions/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await load();
      }
    } catch (e) {
      setError("Failed to start session.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleQuickTogglePause() {
    if (!overview?.activeSessionId) return;
    setActionBusy(true);
    try {
      const actionName = overview.activeSessionStatus === "PAUSED" ? "resume" : "pause";
      const res = await fetch(`${API}/focus/sessions/${overview.activeSessionId}/${actionName}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        await load();
      }
    } catch (e) {
      setError("Action failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleQuickStop() {
    if (!overview?.activeSessionId) return;
    setActionBusy(true);
    try {
      const res = await fetch(`${API}/focus/sessions/${overview.activeSessionId}/stop`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        await load();
      }
    } catch (e) {
      setError("Failed to stop session.");
    } finally {
      setActionBusy(false);
    }
  }

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return dateStr === localToday;
  };

  const liveSessionSeconds = overview?.isFocusingNow ? (overview.activeSessionSeconds ?? 0) : 0;

  const totalWeekSeconds = useMemo(() => {
    const base = trend?.studyMinutes.reduce((acc, curr) => acc + (curr.seconds ?? (curr.minutes * 60)), 0) ?? 0;
    return base + liveSessionSeconds;
  }, [trend?.studyMinutes, liveSessionSeconds]);

  const totalWeekMinutes = Math.floor(totalWeekSeconds / 60);

  const maxSecondsInWeek = useMemo(() => {
    const daySecs = (trend?.studyMinutes ?? []).map((x) => {
      const isTod = isToday(x.date);
      return (x.seconds ?? (x.minutes * 60)) + (isTod ? liveSessionSeconds : 0);
    });
    return Math.max(1800, ...daySecs);
  }, [trend?.studyMinutes, liveSessionSeconds]);

  const maxMinutes = Math.ceil(maxSecondsInWeek / 60);

  function formatBarDuration(secs: number, isLive: boolean): string {
    if (isLive) {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}m ${String(s).padStart(2, "0")}s`;
    }
    if (secs <= 0) return "0m";
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (s === 0 || m >= 10) return `${m}m`;
    return `${m}m ${s}s`;
  }

  // Compute Active Practice Days: count days with study time, completed tasks, or quizzes
  const activeDaysCount = useMemo(() => {
    if (!trend?.studyMinutes) return 0;
    let count = 0;
    for (let i = 0; i < trend.studyMinutes.length; i++) {
      const m = trend.studyMinutes[i].minutes;
      const s = trend.studyMinutes[i].seconds ?? 0;
      const t = trend.taskCompletions[i]?.completed ?? 0;
      const q = trend.quizAccuracy[i]?.percent !== undefined;
      const todayMatch = isToday(trend.studyMinutes[i].date);
      const isTodayActive = todayMatch && (overview?.isFocusingNow || (overview?.activeSessionSeconds ?? 0) > 0);
      if (m > 0 || s > 0 || t > 0 || q || isTodayActive) {
        count++;
      }
    }
    return count;
  }, [trend, overview?.isFocusingNow, overview?.activeSessionSeconds]);

  // Derived Topic Mastery Insights
  const topicInsights = useMemo(() => {
    const topicMap: Record<string, { totalScore: number; count: number }> = {};
    for (const q of quizzes) {
      if (typeof q.scorePercent !== "number" || isNaN(q.scorePercent)) continue;
      const t = q.topic || q.title.replace(/^(Quiz\s+on\s+|Practice:\s*)/i, "").trim() || "Data Structures";
      if (!topicMap[t]) topicMap[t] = { totalScore: 0, count: 0 };
      topicMap[t].totalScore += q.scorePercent;
      topicMap[t].count += 1;
    }

    return Object.entries(topicMap)
      .filter(([_, data]) => data.count > 0 && !isNaN(data.totalScore))
      .map(([topic, data]) => {
        const avg = Math.round(data.totalScore / data.count);
        return {
          topic,
          averageScore: avg,
          attempts: data.count,
          isWeak: avg < 65,
          isMastered: avg >= 80,
        };
      })
      .sort((a, b) => a.averageScore - b.averageScore);
  }, [quizzes]);

  const activityRows = useMemo(() => {
    if (!trend?.studyMinutes) return [];
    return trend.studyMinutes
      .map((day, i) => {
        const completedCount = trend.taskCompletions[i]?.completed ?? 0;
        const quizAcc = trend.quizAccuracy[i]?.percent;
        const todayMatch = isToday(day.date);
        const liveSecs = todayMatch && overview?.isFocusingNow ? (overview.activeSessionSeconds ?? 0) : 0;
        const effectiveMins = day.minutes + Math.floor(liveSecs / 60);
        const hasActivity = effectiveMins > 0 || completedCount > 0 || (quizAcc !== undefined && quizAcc !== null) || liveSecs > 0;
        return {
          date: day.date,
          minutes: effectiveMins,
          liveSeconds: liveSecs % 60,
          completedCount,
          quizAcc,
          hasActivity,
        };
      })
      .filter((row) => (hideEmptyDays ? row.hasActivity || isToday(row.date) : true));
  }, [trend, hideEmptyDays, overview?.isFocusingNow, overview?.activeSessionSeconds]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-primary text-brand-neutral">
      <Navbar />

      <main className="app-container page-wrapper flex-1 py-8">
        <PageHeader
          eyebrow="Performance Telemetry"
          eyebrowIcon={<TrendingUp size={13} className="text-brand-neutral" />}
          title="Progress & Analytics"
          description="Real-time verified study intervals, schedule velocity, and topic retention across all modules."
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-secondary border border-emerald-500/30 text-[11px] text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                  {overview?.isFocusingNow ? "Live Focus Session" : "Live Telemetry"}
                </span>
              </div>

              {!overview?.isFocusingNow && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleQuickStart}
                  disabled={actionBusy}
                  icon={<Play size={13} className="text-emerald-400" />}
                  className="text-xs border-emerald-500/30 hover:border-emerald-500/60"
                >
                  Start Focus
                </Button>
              )}

              <Link href="/focus">
                <Button variant="secondary" size="sm" icon={<Clock size={13} />} className="text-xs">
                  Focus Mode
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="primary" size="sm" icon={<CheckCircle2 size={13} />} className="text-xs">
                  Tasks
                </Button>
              </Link>
            </div>
          }
        />

        {/* Real-time Focus Session Active Notification Banner */}
        {overview?.isFocusingNow && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 mb-6 rounded-xl bg-gradient-to-r from-emerald-950/40 via-brand-secondary to-brand-raised border border-emerald-500/40 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Real-Time Focus Session Active</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LIVE TICKER
                  </span>
                </div>
                <p className="text-xs text-brand-neutral mt-0.5">
                  Recording elapsed:{" "}
                  <span className="font-mono font-bold text-emerald-300 text-sm">
                    +{Math.floor((overview.activeSessionSeconds ?? 0) / 60)}m{" "}
                    {String((overview.activeSessionSeconds ?? 0) % 60).padStart(2, "0")}s
                  </span>
                  . Daily charts and cumulative totals increment in real time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleQuickTogglePause}
                disabled={actionBusy}
                icon={overview.activeSessionStatus === "PAUSED" ? <Play size={12} /> : <Pause size={12} />}
                className="text-xs"
              >
                {overview.activeSessionStatus === "PAUSED" ? "Resume" : "Pause"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleQuickStop}
                disabled={actionBusy}
                icon={<Square size={12} className="text-white fill-current" />}
                className="text-xs bg-emerald-700 hover:bg-emerald-600 border-none text-white"
              >
                Finish & Save
              </Button>
              <Link href="/focus">
                <Button variant="ghost" size="sm" icon={<Clock size={12} />} className="text-xs text-emerald-200">
                  Full Timer
                </Button>
              </Link>
            </div>
          </div>
        )}

        {demoMode && (
          <div className="px-4 py-3 rounded-lg bg-brand-accent/20 border border-brand-neutral/20 text-brand-light text-xs mb-6">
            <span className="font-semibold text-brand-neutral">Preview mode:</span> Demonstrating 7-day study telemetry. Complete timer sessions and quizzes to record live metrics.
          </div>
        )}

        {error && (
          <div role="alert" className="px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs mb-6">
            {error}
          </div>
        )}

        {overview && (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
              <StatCard
                label="Study Time Recorded"
                value={
                  overview.isFocusingNow
                    ? `${Math.max(overview.totalStudyMinutes, totalWeekMinutes)}m ${((overview.activeSessionSeconds ?? 0) % 60)}s`
                    : Math.max(overview.totalStudyMinutes, totalWeekMinutes)
                }
                unit={overview.isFocusingNow ? "" : "min"}
                icon={Clock}
                iconColor="#7692FF"
                subtext={
                  overview.isFocusingNow ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Live: +{Math.floor((overview.activeSessionSeconds ?? 0) / 60)}m{" "}
                      {String((overview.activeSessionSeconds ?? 0) % 60).padStart(2, "0")}s active
                    </span>
                  ) : totalWeekMinutes > 0 ? (
                    `${totalWeekMinutes}m verified this week`
                  ) : (
                    "Verified focus intervals"
                  )
                }
              />

              <StatCard
                label="Tasks Completed"
                value={`${overview.completedTasks}/${overview.totalTasks}`}
                icon={CheckCircle2}
                iconColor="#10b981"
                progressPercent={
                  overview.totalTasks > 0
                    ? Math.round((overview.completedTasks / overview.totalTasks) * 100)
                    : 0
                }
                subtext={
                  overview.totalTasks > 0
                    ? `${overview.taskCompletionPercent}% schedule velocity`
                    : "0% velocity · Plan tasks"
                }
              />

              <StatCard
                label="Active Practice Days"
                value={`${activeDaysCount}/7`}
                unit="days"
                icon={Flame}
                iconColor="#f59e0b"
                progressPercent={Math.round((activeDaysCount / 7) * 100)}
                subtext={
                  activeDaysCount >= 4
                    ? "Consistent momentum this week"
                    : "Aim for 4+ study days weekly"
                }
              />

              <StatCard
                label="Quiz Accuracy"
                value={overview.quizAttempts > 0 ? `${overview.quizAccuracyPercent}%` : "—"}
                icon={Award}
                iconColor="#ABD2FA"
                subtext={
                  overview.quizAttempts > 0
                    ? `${overview.quizAttempts} test attempt${overview.quizAttempts === 1 ? "" : "s"}`
                    : "Take quizzes to test recall"
                }
              />
            </div>

            {/* 7-Day Study Time Distribution Chart */}
            <section className="p-5 sm:p-6 rounded-xl bg-brand-secondary border border-brand-neutral/20 mb-8 shadow-lg shadow-[#091540]/40">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-brand-light">Study Time Distribution</h2>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1B2CC1]/20 text-[#ABD2FA] border border-[#7692FF]/30">
                      7-Day Telemetry
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted mt-0.5">Daily verified focus minutes and active session intervals</p>
                </div>
                <div className="flex items-center gap-2">
                  {overview.isFocusingNow ? (
                    <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono shadow-sm shadow-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Live Active: {formatBarDuration(overview.activeSessionSeconds ?? 0, true)}</span>
                    </div>
                  ) : (
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-[#102161]/60 border border-[#7692FF]/20 text-[#ABD2FA] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7692FF]" />
                      Real-time Synced
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-brand-raised border border-brand-neutral/25 text-xs">
                    <span className="text-brand-muted">Week Total:</span>
                    <span className="font-semibold text-brand-neutral font-mono text-[#ABD2FA]">
                      {totalWeekMinutes > 0 ? `${totalWeekMinutes}m` : "0m"}
                      {totalWeekSeconds % 60 > 0 && totalWeekMinutes < 60 ? ` ${totalWeekSeconds % 60}s` : ""}
                    </span>
                  </div>
                </div>
              </div>

              {trend && (
                <div className="relative">
                  {totalWeekSeconds === 0 && !overview.isFocusingNow ? (
                    <div className="py-10 text-center rounded-lg bg-brand-raised border border-dashed border-brand-neutral/25">
                      <Clock size={24} className="text-brand-muted mx-auto mb-2" />
                      <h3 className="text-xs font-semibold text-brand-neutral mb-1">No Study Minutes Recorded This Week</h3>
                      <p className="text-xs text-brand-muted max-w-sm mx-auto mb-3">
                        Start a focused study block using the Focus Timer to log minutes here automatically.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleQuickStart}
                        icon={<Play size={13} />}
                        className="text-xs"
                      >
                        Start Live Session
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-end h-52 gap-2 sm:gap-3 pt-8 pb-3 relative">
                      {/* Gridlines */}
                      <div className="absolute left-10 right-0 top-8 border-t border-dashed border-brand-neutral/15" />
                      <div className="absolute left-10 right-0 top-24 border-t border-dashed border-brand-neutral/15" />
                      <div className="absolute left-10 right-0 bottom-9 border-t border-brand-neutral/25" />

                      {/* Y-Axis Labels */}
                      <div className="w-8 h-full flex flex-col justify-between pb-9 text-[10px] font-mono text-brand-muted text-right select-none">
                        <span>{maxMinutes}m</span>
                        <span>{Math.round(maxMinutes / 2)}m</span>
                        <span>0m</span>
                      </div>

                      {/* Bars Container */}
                      <div className="flex-1 flex justify-around items-end h-full relative pl-2">
                        {trend.studyMinutes.map((day, idx) => {
                          const todayMatch = isToday(day.date);
                          const liveSecs = todayMatch && overview?.isFocusingNow ? (overview.activeSessionSeconds ?? 0) : 0;
                          const effectiveSeconds = (day.seconds ?? (day.minutes * 60)) + liveSecs;
                          const maxSecs = Math.max(1800, maxMinutes * 60);
                          const heightPct =
                            effectiveSeconds > 0
                              ? Math.max(14, Math.min(100, Math.round((effectiveSeconds / maxSecs) * 82)))
                              : 4;
                          const dayTasks = trend.taskCompletions[idx]?.completed ?? 0;
                          const dayQuizAcc = trend.quizAccuracy[idx]?.percent;
                          const isHovered = activeTooltipDay === day.date;
                          const dayDateObj = new Date(`${day.date}T12:00:00`);

                          return (
                            <div
                              key={day.date}
                              onMouseEnter={() => setActiveTooltipDay(day.date)}
                              onMouseLeave={() => setActiveTooltipDay(null)}
                              className="flex flex-col items-center flex-1 h-full justify-end relative cursor-pointer group"
                            >
                              {/* Hover Tooltip */}
                              {isHovered && (
                                <div
                                  className="absolute left-1/2 -translate-x-1/2 bg-[#091540] border border-[#7692FF]/40 rounded-lg p-2.5 text-[11px] whitespace-nowrap z-30 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95"
                                  style={{ bottom: `${heightPct + 36}%` }}
                                >
                                  <div className="font-semibold text-brand-light flex items-center gap-1.5">
                                    <span>
                                      {dayDateObj.toLocaleDateString(undefined, {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                    {todayMatch && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1B2CC1]/40 text-[#ABD2FA] border border-[#7692FF]/40">
                                        TODAY
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[#ABD2FA] font-mono font-medium mt-1">
                                    {formatBarDuration(effectiveSeconds, Boolean(todayMatch && overview?.isFocusingNow))} verified
                                    {todayMatch && liveSecs > 0 && (
                                      <span className="text-emerald-400 ml-1.5">(+{liveSecs}s active)</span>
                                    )}
                                  </div>
                                  {dayTasks > 0 && (
                                    <div className="text-emerald-400 font-mono mt-0.5">{dayTasks} task(s) completed</div>
                                  )}
                                  {dayQuizAcc !== undefined && dayQuizAcc !== null && (
                                    <div className="text-[#7692FF] font-mono mt-0.5">{dayQuizAcc}% quiz score</div>
                                  )}
                                </div>
                              )}

                              {/* Value Label above Bar */}
                              <div className="flex flex-col items-center mb-1.5 transition-transform duration-200 group-hover:-translate-y-0.5">
                                {todayMatch && overview?.isFocusingNow ? (
                                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/50 px-1.5 py-0.5 rounded-full shadow-sm shadow-emerald-500/20 animate-pulse whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    {formatBarDuration(effectiveSeconds, true)}
                                  </span>
                                ) : effectiveSeconds > 0 ? (
                                  <span className="text-[11px] font-mono font-semibold text-[#ABD2FA] bg-[#102161]/80 px-1.5 py-0.5 rounded border border-[#7692FF]/30 whitespace-nowrap shadow-sm">
                                    {formatBarDuration(effectiveSeconds, false)}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-brand-muted/40 font-medium">0m</span>
                                )}
                              </div>

                              {/* Bar */}
                              <div
                                className={`w-9 sm:w-11 rounded-t-md transition-all duration-300 ${
                                  todayMatch && overview?.isFocusingNow
                                    ? "bg-gradient-to-t from-[#1B2CC1] to-[#7692FF] ring-2 ring-[#7692FF]/80 shadow-lg shadow-[#1B2CC1]/50 animate-pulse"
                                    : effectiveSeconds > 0
                                    ? todayMatch
                                      ? "bg-gradient-to-t from-[#1B2CC1] to-[#7692FF] ring-1 ring-[#ABD2FA]/50 shadow-md shadow-[#1B2CC1]/40"
                                      : "bg-gradient-to-t from-[#0D1E5B] to-[#1B2CC1] hover:from-[#1B2CC1] hover:to-[#7692FF] border border-[#7692FF]/30 shadow-sm"
                                    : "bg-[#102161]/40 border-t border-[#7692FF]/20"
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />

                              {/* Day Label */}
                              <div className="flex flex-col items-center mt-2">
                                <span
                                  className={`text-[11px] font-mono ${
                                    todayMatch
                                      ? "text-[#ABD2FA] font-bold"
                                      : "text-brand-muted font-medium"
                                  }`}
                                >
                                  {todayMatch
                                    ? "Today"
                                    : dayDateObj.toLocaleDateString(undefined, {
                                        weekday: "short",
                                      })}
                                </span>
                                <span className="text-[9px] font-mono text-brand-muted/60 mt-0.5">
                                  {dayDateObj.toLocaleDateString(undefined, {
                                    month: "numeric",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Bottom Two-Column Section: Topic Mastery & Daily Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Topic Mastery */}
              <section className="p-5 sm:p-6 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-brand-light">Topic Mastery</h2>
                    <p className="text-xs text-brand-muted mt-0.5">Derived from verified quiz attempts</p>
                  </div>
                  <Brain size={16} className="text-brand-neutral" />
                </div>

                {topicInsights.length === 0 ? (
                  <div className="py-8 text-center rounded-lg bg-brand-raised border border-dashed border-brand-neutral/20">
                    <p className="text-xs text-brand-muted mb-2">No quiz topic data recorded yet.</p>
                    <Link href="/quizzes">
                      <Button variant="ghost" size="sm" icon={<ArrowRight size={13} />} className="text-xs">
                        Take a Quiz
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topicInsights.map((ti) => (
                      <div
                        key={ti.topic}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                          ti.isWeak
                            ? "bg-rose-950/20 border-rose-500/20"
                            : "bg-brand-raised border-brand-neutral/20"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {ti.isWeak && <AlertTriangle size={12} className="text-rose-400 shrink-0" />}
                            <h4 className="text-xs font-medium text-brand-neutral truncate">{ti.topic}</h4>
                          </div>
                          <p className="text-[11px] text-brand-muted mt-0.5">
                            {ti.attempts} quiz attempt{ti.attempts === 1 ? "" : "s"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              ti.isWeak
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : ti.isMastered
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-brand-secondary text-brand-neutral border border-brand-neutral/30"
                            }`}
                          >
                            {ti.isWeak ? "Review" : ti.isMastered ? "Mastered" : "Practicing"}
                          </span>
                          <span className="text-xs font-semibold font-mono text-brand-neutral w-9 text-right">
                            {ti.averageScore}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Right Column: Daily Activity Table */}
              <section className="p-5 sm:p-6 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-brand-light">Daily Breakdown</h2>
                    <p className="text-xs text-brand-muted mt-0.5">Sessions, tasks, and accuracy</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHideEmptyDays((prev) => !prev)}
                    className="flex items-center gap-1 text-[11px] text-brand-neutral hover:text-brand-neutral px-2 py-1 rounded bg-brand-raised border border-brand-neutral/25 transition-colors"
                  >
                    {hideEmptyDays ? <Eye size={12} /> : <EyeOff size={12} />}
                    {hideEmptyDays ? "Show all" : "Hide inactive"}
                  </button>
                </div>

                {activityRows.length === 0 ? (
                  <p className="text-xs text-brand-muted text-center py-6">No activity recorded in this period.</p>
                ) : (
                  <div className="space-y-1.5">
                    {activityRows.map((row) => {
                      const todayMatch = isToday(row.date);
                      const formattedDate = new Date(`${row.date}T12:00:00`).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <div
                          key={row.date}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                            todayMatch
                              ? "bg-brand-accent/10 border-brand-neutral/20 text-brand-neutral"
                              : "bg-brand-raised border-brand-neutral/20 text-brand-neutral"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={todayMatch ? "font-semibold text-brand-neutral" : "text-brand-neutral"}>
                              {formattedDate}
                            </span>
                            {todayMatch && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-accent/20 text-brand-light font-mono">
                                Today
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <span className={row.minutes > 0 || row.liveSeconds > 0 ? "text-brand-neutral font-mono" : "text-brand-muted font-mono"}>
                              {row.minutes}m{row.liveSeconds > 0 ? ` +${row.liveSeconds}s` : ""}
                            </span>
                            <span className={row.completedCount > 0 ? "text-emerald-400" : "text-brand-muted"}>
                              {row.completedCount} task{row.completedCount === 1 ? "" : "s"}
                            </span>
                            {row.quizAcc !== undefined && (
                              <span className="text-brand-neutral font-mono">{row.quizAcc}% quiz</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
