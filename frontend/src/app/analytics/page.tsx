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
  Calendar,
  Flame,
  AlertTriangle,
  Brain,
  HelpCircle,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import { demoOverview, demoTrends } from "../demo-data";
import { Navbar } from "../navbar";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Overview = {
  totalStudyMinutes: number;
  completedTasks: number;
  totalTasks: number;
  taskCompletionPercent: number;
  quizAttempts: number;
  quizAccuracyPercent: number;
};

type Trend = {
  studyMinutes: { date: string; minutes: number }[];
  taskCompletions: { date: string; completed: number }[];
  quizAccuracy: { date: string; percent: number }[];
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
        {
          id: 3,
          title: "The Silk Road & Trade Networks",
          topic: "World History",
          scorePercent: 60,
          questionCount: 5,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const maxMinutes = Math.max(30, ...(trend?.studyMinutes.map((x) => x.minutes) ?? []));
  const totalWeekMinutes = trend?.studyMinutes.reduce((acc, curr) => acc + curr.minutes, 0) ?? 0;

  // Active study days in the 7-day window
  const activeDaysCount = useMemo(() => {
    if (!trend?.studyMinutes) return 0;
    return trend.studyMinutes.filter((d) => d.minutes > 0).length;
  }, [trend]);

  // Topic mastery calculation from quizzes
  const topicInsights = useMemo(() => {
    const topicMap: Record<string, { totalScore: number; count: number }> = {};
    for (const q of quizzes) {
      if (q.scorePercent === null) continue;
      const t = q.topic || "General Studies";
      if (!topicMap[t]) topicMap[t] = { totalScore: 0, count: 0 };
      topicMap[t].totalScore += q.scorePercent;
      topicMap[t].count += 1;
    }

    return Object.entries(topicMap).map(([topic, data]) => {
      const avg = Math.round(data.totalScore / data.count);
      return {
        topic,
        averageScore: avg,
        attempts: data.count,
        isWeak: avg < 65,
        isMastered: avg >= 80,
      };
    }).sort((a, b) => a.averageScore - b.averageScore);
  }, [quizzes]);

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    return dateStr === today;
  };

  // Filtered activity rows
  const activityRows = useMemo(() => {
    if (!trend?.studyMinutes) return [];
    return trend.studyMinutes
      .map((day, i) => {
        const completedCount = trend.taskCompletions[i]?.completed ?? 0;
        const quizAcc = trend.quizAccuracy[i]?.percent;
        const hasActivity = day.minutes > 0 || completedCount > 0 || quizAcc !== undefined;
        return {
          date: day.date,
          minutes: day.minutes,
          completedCount,
          quizAcc,
          hasActivity,
        };
      })
      .filter((row) => (hideEmptyDays ? row.hasActivity || isToday(row.date) : true));
  }, [trend, hideEmptyDays]);

  return (
    <>
      <Navbar />
      <main className="app-container" style={{ paddingBottom: "100px", paddingTop: "24px" }}>
        <PageHeader
          eyebrow="Live Performance Telemetry"
          title="Progress & Analytics"
          description="Track your verifiable study time, task completion velocity, and topic retention across all modules."
          actions={
            <div style={{ display: "flex", gap: "10px" }}>
              <Link href="/focus">
                <Button variant="ghost" size="sm" icon={<Clock size={15} />}>
                  Focus Session
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="primary" size="sm" icon={<CheckCircle2 size={15} />}>
                  View Tasks
                </Button>
              </Link>
            </div>
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
            }}
          >
            <strong>Preview mode:</strong> Sample 7-day study telemetry shown. Complete focus sessions and quizzes to record live metrics.
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

        {overview && (
          <>
            {/* 4 Distinct Stat Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
                marginBottom: "36px",
              }}
            >
              {/* 1. Verified Study Time */}
              <StatCard
                label="Study Time Recorded"
                value={overview.totalStudyMinutes}
                unit="min"
                icon={Clock}
                iconColor="var(--accent-lime)"
                subtext={
                  overview.totalStudyMinutes > 0
                    ? "Verified focus timer intervals"
                    : "Log time via Focus Mode timer"
                }
              />

              {/* 2. Tasks Completed & Velocity */}
              <StatCard
                label="Tasks Completed"
                value={`${overview.completedTasks}/${overview.totalTasks}`}
                icon={CheckCircle2}
                iconColor="var(--mint)"
                progressPercent={
                  overview.totalTasks > 0
                    ? Math.round((overview.completedTasks / overview.totalTasks) * 100)
                    : 0
                }
                subtext={`${overview.taskCompletionPercent}% schedule velocity`}
              />

              {/* 3. Study Consistency / Active Days (Replaces duplicate Task Completion %) */}
              <StatCard
                label="Active Practice Days"
                value={`${activeDaysCount}/7`}
                unit="days"
                icon={Flame}
                iconColor="#ff9d00"
                progressPercent={Math.round((activeDaysCount / 7) * 100)}
                subtext={
                  activeDaysCount >= 4
                    ? "Consistent momentum this week"
                    : "Aim for 4+ study days weekly"
                }
              />

              {/* 4. Quiz Accuracy */}
              <StatCard
                label="Quiz Accuracy"
                value={overview.quizAttempts > 0 ? `${overview.quizAccuracyPercent}%` : "—"}
                icon={Award}
                iconColor="var(--accent-lime)"
                subtext={
                  overview.quizAttempts > 0
                    ? `${overview.quizAttempts} test attempt${overview.quizAttempts === 1 ? "" : "s"}`
                    : "Take quizzes to test recall"
                }
              />
            </div>

            {/* Compact 7-Day Study Time Chart with Y-Axis and Tooltips */}
            <section
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "20px",
                padding: "24px 28px",
                marginBottom: "36px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "17px", fontWeight: 600, margin: 0 }}>
                    Study Time Distribution
                  </h2>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--mist)" }}>
                    Daily verified minutes over the past 7 days.
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(196, 255, 106, 0.08)",
                    border: "1px solid rgba(196, 255, 106, 0.2)",
                    borderRadius: "10px",
                    padding: "6px 14px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "var(--mist)" }}>Week Total:</span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--accent-lime)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {totalWeekMinutes} mins
                  </span>
                </div>
              </div>

              {trend && (
                <div style={{ position: "relative" }}>
                  {totalWeekMinutes === 0 ? (
                    <div
                      style={{
                        padding: "36px 20px",
                        textAlign: "center",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px dashed var(--border-subtle)",
                      }}
                    >
                      <Clock size={28} color="var(--mist)" style={{ margin: "0 auto 10px" }} />
                      <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 6px" }}>
                        No Study Minutes Recorded This Week
                      </h3>
                      <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--mist)", maxWidth: "440px", marginLeft: "auto", marginRight: "auto" }}>
                        Start a focused study block using the Focus Timer. Any session of 1 minute or longer is recorded here automatically.
                      </p>
                      <Link href="/focus">
                        <Button variant="primary" size="sm" icon={<Clock size={14} />}>
                          Launch Focus Session
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        height: "180px",
                        gap: "12px",
                        paddingTop: "24px",
                        paddingBottom: "8px",
                        position: "relative",
                      }}
                    >
                      {/* Horizontal Gridlines */}
                      <div
                        style={{
                          position: "absolute",
                          left: "40px",
                          right: 0,
                          top: "24px",
                          borderTop: "1px dashed rgba(255,255,255,0.06)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: "40px",
                          right: 0,
                          top: "84px",
                          borderTop: "1px dashed rgba(255,255,255,0.06)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: "40px",
                          right: 0,
                          bottom: "32px",
                          borderTop: "1px solid var(--border-subtle)",
                        }}
                      />

                      {/* Y-Axis Labels */}
                      <div
                        style={{
                          width: "36px",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          paddingBottom: "32px",
                          fontSize: "10px",
                          color: "var(--mist)",
                          textAlign: "right",
                        }}
                      >
                        <span>{maxMinutes}m</span>
                        <span>{Math.round(maxMinutes / 2)}m</span>
                        <span>0m</span>
                      </div>

                      {/* Chart Columns */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          justifyContent: "space-around",
                          alignItems: "flex-end",
                          height: "100%",
                          position: "relative",
                        }}
                      >
                        {trend.studyMinutes.map((day, idx) => {
                          const todayMatch = isToday(day.date);
                          const heightPct =
                            maxMinutes > 0 && day.minutes > 0
                              ? Math.max(10, Math.round((day.minutes / maxMinutes) * 80))
                              : 4;
                          const dayTasks = trend.taskCompletions[idx]?.completed ?? 0;
                          const dayQuizAcc = trend.quizAccuracy[idx]?.percent;
                          const isHovered = activeTooltipDay === day.date;

                          return (
                            <div
                              key={day.date}
                              onMouseEnter={() => setActiveTooltipDay(day.date)}
                              onMouseLeave={() => setActiveTooltipDay(null)}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                flex: 1,
                                height: "100%",
                                justifyContent: "flex-end",
                                position: "relative",
                                cursor: "pointer",
                              }}
                            >
                              {/* Hover Tooltip */}
                              {isHovered && (
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: `${heightPct + 36}%`,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    background: "var(--surface-3)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                    fontSize: "11px",
                                    whiteSpace: "nowrap",
                                    zIndex: 20,
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                                    pointerEvents: "none",
                                  }}
                                >
                                  <div style={{ fontWeight: 600, color: "var(--paper)" }}>
                                    {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </div>
                                  <div style={{ color: "var(--accent-lime)", marginTop: "2px" }}>
                                    ⏱️ {day.minutes} study min
                                  </div>
                                  {dayTasks > 0 && (
                                    <div style={{ color: "var(--mint)" }}>
                                      ✅ {dayTasks} task{dayTasks > 1 ? "s" : ""} done
                                    </div>
                                  )}
                                  {dayQuizAcc !== undefined && (
                                    <div style={{ color: "var(--info)" }}>
                                      🎯 {dayQuizAcc}% quiz score
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Bar Pillar */}
                              <div
                                style={{
                                  width: "min(36px, 60%)",
                                  height: `${heightPct}%`,
                                  borderRadius: "6px 6px 2px 2px",
                                  background:
                                    day.minutes > 0
                                      ? todayMatch
                                        ? "linear-gradient(180deg, var(--accent-lime) 0%, rgba(132, 229, 188, 0.4) 100%)"
                                        : "linear-gradient(180deg, rgba(132, 229, 188, 0.8) 0%, rgba(50, 150, 100, 0.3) 100%)"
                                      : "rgba(255, 255, 255, 0.05)",
                                  boxShadow:
                                    day.minutes > 0
                                      ? "0 0 12px rgba(196, 255, 106, 0.2)"
                                      : "none",
                                  transition: "height 0.3s ease, background 0.15s ease",
                                  marginBottom: "8px",
                                }}
                              />

                              {/* Day Label */}
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: todayMatch ? 700 : 500,
                                  color: todayMatch ? "var(--accent-lime)" : "var(--mist)",
                                }}
                              >
                                {todayMatch
                                  ? "Today"
                                  : new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
                                      weekday: "narrow",
                                    })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Bottom Two-Column Section: Weak-Topic Insights + Activity Log */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "28px",
              }}
            >
              {/* Left Column: Weak Topics & Mastery Insight */}
              <section
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
                    <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
                      Topic Mastery & Focus Areas
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--mist)" }}>
                      Derived from your verified quiz attempts and answer accuracy.
                    </p>
                  </div>
                  <Brain size={18} color="var(--accent-lime)" />
                </div>

                {topicInsights.length === 0 ? (
                  <div
                    style={{
                      padding: "28px 16px",
                      textAlign: "center",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px dashed var(--border-subtle)",
                    }}
                  >
                    <p style={{ margin: "0 0 10px", fontSize: "13px", color: "var(--mist)" }}>
                      No quiz topic data recorded yet.
                    </p>
                    <Link href="/quizzes">
                      <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>
                        Generate or Take a Quiz
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {topicInsights.map((ti) => (
                      <div
                        key={ti.topic}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "12px",
                          background: ti.isWeak
                            ? "rgba(255, 107, 107, 0.05)"
                            : "rgba(255, 255, 255, 0.03)",
                          border: ti.isWeak
                            ? "1px solid rgba(255, 107, 107, 0.25)"
                            : "1px solid var(--border-subtle)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {ti.isWeak && (
                              <AlertTriangle size={13} color="var(--danger)" />
                            )}
                            <h4
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
                              {ti.topic}
                            </h4>
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--mist)" }}>
                            {ti.attempts} quiz attempt{ti.attempts === 1 ? "" : "s"}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "8px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: ti.isWeak
                                ? "rgba(255, 107, 107, 0.15)"
                                : ti.isMastered
                                ? "rgba(196, 255, 106, 0.15)"
                                : "rgba(255, 255, 255, 0.08)",
                              color: ti.isWeak
                                ? "var(--danger)"
                                : ti.isMastered
                                ? "var(--accent-lime)"
                                : "var(--paper)",
                            }}
                          >
                            {ti.isWeak ? "Needs Review" : ti.isMastered ? "Mastered" : "Practicing"}
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              fontVariantNumeric: "tabular-nums",
                              color: ti.isWeak
                                ? "var(--danger)"
                                : ti.isMastered
                                ? "var(--accent-lime)"
                                : "var(--paper)",
                            }}
                          >
                            {ti.averageScore}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Right Column: Daily Activity Table with Zero-Row Collapse Filter */}
              <section
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
                    <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
                      Daily Activity Breakdown
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--mist)" }}>
                      Study sessions, tasks completed, and quiz scores.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHideEmptyDays((prev) => !prev)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--mist)",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    {hideEmptyDays ? <Eye size={13} /> : <EyeOff size={13} />}
                    {hideEmptyDays ? "Show all 7 days" : "Hide inactive days"}
                  </button>
                </div>

                {activityRows.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--mist)", textAlign: "center", margin: "24px 0" }}>
                    No activity recorded in this period.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {activityRows.map((row) => {
                      const todayMatch = isToday(row.date);
                      const formattedDate = new Date(`${row.date}T12:00:00`).toLocaleDateString(
                        undefined,
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }
                      );

                      return (
                        <div
                          key={row.date}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            background: todayMatch
                              ? "rgba(196, 255, 106, 0.05)"
                              : "rgba(255, 255, 255, 0.02)",
                            border: todayMatch
                              ? "1px solid rgba(196, 255, 106, 0.2)"
                              : "1px solid var(--border-subtle)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "13px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: todayMatch ? 700 : 500, color: "var(--paper)" }}>
                              {formattedDate}
                            </span>
                            {todayMatch && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  color: "var(--accent-lime)",
                                  background: "rgba(196,255,106,0.15)",
                                  padding: "1px 6px",
                                  borderRadius: "6px",
                                }}
                              >
                                Today
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
                            <span
                              style={{
                                color: row.minutes > 0 ? "var(--accent-lime)" : "var(--mist)",
                                fontWeight: row.minutes > 0 ? 600 : 400,
                              }}
                            >
                              {row.minutes}m
                            </span>
                            <span
                              style={{
                                color: row.completedCount > 0 ? "var(--mint)" : "var(--mist)",
                                fontWeight: row.completedCount > 0 ? 600 : 400,
                              }}
                            >
                              {row.completedCount} task{row.completedCount === 1 ? "" : "s"}
                            </span>
                            {row.quizAcc !== undefined && (
                              <span
                                style={{
                                  color: "var(--info)",
                                  fontWeight: 600,
                                }}
                              >
                                {row.quizAcc}% quiz
                              </span>
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
    </>
  );
}
