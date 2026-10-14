"use client";

import { useCallback, useEffect, useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  Edit3,
  X,
  Play,
  ListTodo,
  AlertTriangle,
  RotateCw,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Navbar } from "../navbar";
import {
  PageHeader,
  Button,
  ConfirmDialog,
  EmptyState,
  Skeleton,
} from "@/components/ui";

type Task = {
  id: number;
  title: string;
  subject?: string;
  scheduledDate?: string;
  estimatedMinutes: number;
  priority: string;
  status: string;
};

type Plan = {
  id: number;
  startDate: string;
  endDate: string;
  dailyAvailableMinutes: number;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPlanConfig, setShowPlanConfig] = useState(false);
  const [dailyMinutesInput, setDailyMinutesInput] = useState<number>(60);
  const [taskMinutesInput, setTaskMinutesInput] = useState<number>(30);

  // Confirmation dialogs
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingRegenForm, setPendingRegenForm] = useState<FormData | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [taskRes, planRes] = await Promise.all([
        fetch(`${API}/tasks`, { credentials: "include" }),
        fetch(`${API}/plans/current`, { credentials: "include" }),
      ]);

      if (taskRes.status === 401) {
        router.push("/login");
        return;
      }

      if (taskRes.ok) {
        const tasksData = await taskRes.json();
        setTasks(Array.isArray(tasksData) ? tasksData : (tasksData?.content ?? []));
      }

      if (planRes.ok && planRes.status !== 204) {
        const planData = await planRes.json();
        setPlan(planData?.plan ?? planData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Execute plan generation
  async function executePlanGeneration(formData?: FormData) {
    setBusy(true);
    setError("");
    setSuccess("");

    const minutes = formData ? Number(formData.get("minutes")) : dailyMinutesInput;
    const startDate = formData ? (formData.get("startDate") as string) || null : null;

    try {
      const res = await fetch(`${API}/plans/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availableMinutesPerDay: minutes,
          startDate: startDate,
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || result.message || "Failed to generate plan.");

      if (result.plan) setPlan(result.plan);
      if (result.tasks) setTasks(result.tasks);
      setSuccess("Your study schedule has been generated based on your processed notes!");
      setShowRegenConfirm(false);
      setShowPlanConfig(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Plan generation failed.");
    } finally {
      setBusy(false);
    }
  }

  function handlePlanSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setPendingRegenForm(formData);

    // If existing tasks exist, show confirmation dialog before overwriting
    if (tasks.length > 0) {
      setShowRegenConfirm(true);
    } else {
      void executePlanGeneration(formData);
    }
  }

  async function createTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const form = new FormData(e.currentTarget);
    const body = {
      title: String(form.get("title")),
      subject: String(form.get("subject") || "General Study"),
      scheduledDate: (form.get("date") as string) || undefined,
      estimatedMinutes: Number(form.get("duration") || 30),
      priority: String(form.get("priority") || "NORMAL"),
    };

    try {
      const res = await fetch(`${API}/tasks`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.detail || result.error || "Could not add task.");

      setTasks((curr) => [...curr, result as Task]);
      setShowAddForm(false);
      setSuccess(`Task "${body.title}" added to your schedule!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task.");
    }
  }

  async function updateTask(e: FormEvent<HTMLFormElement>, task: Task) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      title: String(form.get("title")),
      subject: String(form.get("subject") || ""),
      scheduledDate: (form.get("date") as string) || undefined,
      estimatedMinutes: Number(form.get("duration")),
      priority: String(form.get("priority")),
    };

    try {
      const res = await fetch(`${API}/tasks/${task.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.detail || "Could not update task.");

      setTasks((curr) => curr.map((item) => (item.id === task.id ? (result as Task) : item)));
      setEditing(null);
      setSuccess("Task updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task.");
    }
  }

  async function toggleComplete(task: Task) {
    const action = task.status === "COMPLETED" ? "reopen" : "complete";
    try {
      const res = await fetch(`${API}/tasks/${task.id}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setTasks((curr) =>
          curr.map((item) =>
            item.id === task.id ? { ...item, status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" } : item
          )
        );
      } else {
        throw new Error("Could not toggle task status.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  async function confirmDeleteTask() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${API}/tasks/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Could not delete task.");
      setTasks((curr) => curr.filter((t) => t.id !== deleteTarget.id));
      setSuccess(`Task "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Group tasks by scheduled date
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    const todayStr = new Date().toISOString().slice(0, 10);

    for (const t of tasks) {
      let key = "Unscheduled";
      if (t.scheduledDate) {
        if (t.scheduledDate === todayStr) key = "Today";
        else if (t.scheduledDate < todayStr) key = "Overdue";
        else key = t.scheduledDate;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }

    return groups;
  }, [tasks]);

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main id="main-content" className="app-container page-wrapper" style={{ flex: 1 }}>
        {/* Unified Page Header */}
        <PageHeader
          eyebrow="Adaptive Study Planning"
          eyebrowIcon={<Sparkles size={13} color="var(--accent-lime)" />}
          title="Daily Study Plan."
          description="Adaptive study blocks generated from your notes, balanced against your daily available study time."
          actions={
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                onClick={() => setShowPlanConfig(!showPlanConfig)}
                icon={<RotateCw size={14} />}
              >
                {showPlanConfig ? "Hide Generator" : "Regenerate Plan"}
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddForm(!showAddForm)}
                icon={<Plus size={16} />}
              >
                Add Custom Task
              </Button>
            </div>
          }
        />

        {success && (
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
            <span>{success}</span>
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
            }}
          >
            {error}
          </div>
        )}

        {/* Progress Strip */}
        <div
          className="glass-panel"
          style={{
            padding: "18px 24px",
            borderRadius: "var(--radius-lg)",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mist)" }}>
              Overall Task Progress
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--paper)", marginTop: "2px" }}>
              {completedCount} of {totalCount} Tasks Completed ({completionPercent}%)
            </div>
          </div>

          <div style={{ width: "220px" }}>
            <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${completionPercent}%`,
                  height: "100%",
                  background: "var(--accent-lime)",
                  borderRadius: "4px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        </div>

        {/* Plan Configuration Dropdown */}
        {showPlanConfig && (
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              borderRadius: "var(--radius-lg)",
              marginBottom: "28px",
              border: "1px solid var(--accent-lime-border)",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--paper)", margin: "0 0 8px" }}>
              Regenerate Adaptive Study Plan
            </h3>
            <p style={{ fontSize: "13px", color: "var(--mist)", margin: "0 0 16px" }}>
              Set your target daily available study time. The planner balances study sessions across all your uploaded notes.
            </p>

            <form onSubmit={handlePlanSubmit} style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ width: "200px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--paper)", fontWeight: 600, marginBottom: "6px" }}>
                  Daily Study Time (mins)
                </label>
                <input
                  name="minutes"
                  type="number"
                  min={15}
                  max={360}
                  step={15}
                  defaultValue={plan?.dailyAvailableMinutes || 60}
                  className="form-control"
                />
              </div>

              <div style={{ width: "200px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--paper)", fontWeight: 600, marginBottom: "6px" }}>
                  Start Date
                </label>
                <input
                  name="startDate"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="form-control"
                />
              </div>

              <Button type="submit" variant="primary" loading={busy}>
                Generate Adaptive Plan
              </Button>
            </form>
          </div>
        )}

        {/* Add Task Form Modal / Inline */}
        {showAddForm && (
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              borderRadius: "var(--radius-lg)",
              marginBottom: "28px",
              border: "1px solid var(--line-bright)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--paper)", margin: 0 }}>
                Create Custom Study Task
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowAddForm(false)}
                style={{ width: "32px", height: "32px" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={createTask} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Task Title</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Read Chapter 4 &amp; outline key definitions"
                  className="form-control"
                />
              </div>

              <div>
                <label className="form-label">Subject / Topic</label>
                <input
                  name="subject"
                  type="text"
                  placeholder="e.g. Biology, Calculus, History"
                  className="form-control"
                />
              </div>

              <div>
                <label className="form-label">Estimated Duration</label>
                <select name="duration" defaultValue={25} className="form-control">
                  <option value={15}>15 mins (Quick review)</option>
                  <option value={25}>25 mins (Pomodoro block)</option>
                  <option value={45}>45 mins (Deep study)</option>
                  <option value={60}>60 mins (Intense block)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Priority</label>
                <select name="priority" defaultValue="NORMAL" className="form-control">
                  <option value="NORMAL">Normal Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>

              <div>
                <label className="form-label">Scheduled Date</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="form-control"
                />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Task
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Task List Grouped by Day */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Skeleton height="72px" />
            <Skeleton height="72px" />
            <Skeleton height="72px" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No study tasks scheduled"
            description="Generate a daily study plan from your uploaded notes, or create custom study tasks."
            action={
              <Button variant="primary" onClick={() => setShowAddForm(true)} icon={<Plus size={15} />}>
                Create Your First Task
              </Button>
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {Object.entries(groupedTasks).map(([groupTitle, groupTasks]) => (
              <section key={groupTitle}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <Calendar size={15} color="var(--mint)" />
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: groupTitle === "Overdue" ? "#fca5a5" : "var(--paper)",
                      margin: 0,
                    }}
                  >
                    {groupTitle} ({groupTasks.filter((t) => t.status === "COMPLETED").length}/{groupTasks.length} Done)
                  </h3>
                  {groupTitle === "Overdue" && <span className="badge badge-danger">Needs Attention</span>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {groupTasks.map((task) => {
                    const isDone = task.status === "COMPLETED";
                    const isHigh = task.priority === "HIGH";
                    const isMed = task.priority === "MEDIUM";

                    if (editing?.id === task.id) {
                      return (
                        <form
                          key={task.id}
                          onSubmit={(e) => updateTask(e, task)}
                          className="glass-card"
                          style={{ padding: "16px", borderRadius: "var(--radius-md)" }}
                        >
                          <div style={{ display: "grid", gap: "10px" }}>
                            <input
                              name="title"
                              defaultValue={task.title}
                              required
                              className="form-control"
                            />
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                              <input
                                name="subject"
                                defaultValue={task.subject}
                                placeholder="Subject"
                                className="form-control"
                                style={{ flex: 1 }}
                              />
                              <select
                                name="priority"
                                defaultValue={task.priority}
                                className="form-control"
                                style={{ width: "130px" }}
                              >
                                <option value="NORMAL">Normal</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                              </select>
                              <Button type="submit" variant="primary" size="sm">
                                Save
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <article
                        key={task.id}
                        className="glass-card"
                        style={{
                          padding: "16px 20px",
                          borderRadius: "var(--radius-md)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "16px",
                          opacity: isDone ? 0.65 : 1,
                          transition: "opacity 0.2s ease",
                        }}
                      >
                        {/* Checkbox & Details */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                          {/* 24px Accessible Checkbox */}
                          <label className="custom-checkbox" style={{ margin: 0, minHeight: "44px" }}>
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => void toggleComplete(task)}
                              aria-label={`Mark "${task.title}" as ${isDone ? "incomplete" : "complete"}`}
                            />
                          </label>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <h4
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 600,
                                  color: isDone ? "var(--mist)" : "var(--paper)",
                                  textDecoration: isDone ? "line-through" : "none",
                                  margin: 0,
                                }}
                              >
                                {task.title}
                              </h4>
                              {isHigh && <span className="badge badge-danger">High Priority</span>}
                              {isMed && <span className="badge badge-warning">Medium</span>}
                            </div>

                            <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "var(--mist)", marginTop: "4px" }}>
                              {task.subject && <span>{task.subject}</span>}
                              <span>&bull; {task.estimatedMinutes} mins</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          {!isDone && (
                            <Button
                              variant="secondary"
                              size="sm"
                              href={`/focus?taskId=${task.id}`}
                              icon={<Play size={13} />}
                            >
                              Focus
                            </Button>
                          )}

                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => setEditing(task)}
                            aria-label={`Edit ${task.title}`}
                            style={{ width: "36px", height: "36px" }}
                          >
                            <Edit3 size={15} color="var(--mist)" />
                          </button>

                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => setDeleteTarget(task)}
                            aria-label={`Delete ${task.title}`}
                            style={{ width: "36px", height: "36px" }}
                          >
                            <Trash2 size={15} color="var(--mist)" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Confirmation Dialog: Regenerate Plan */}
      <ConfirmDialog
        isOpen={showRegenConfirm}
        title="Regenerate Study Plan?"
        description="Regenerating your study plan will recalculate daily sessions from your notes and replace current uncompleted tasks. Completed tasks will remain in your history."
        confirmLabel="Yes, Regenerate Plan"
        cancelLabel="Keep Current Plan"
        danger={false}
        loading={busy}
        onConfirm={() => executePlanGeneration(pendingRegenForm || undefined)}
        onCancel={() => setShowRegenConfirm(false)}
      />

      {/* Confirmation Dialog: Delete Task */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Study Task?"
        description={`Are you sure you want to remove "${deleteTarget?.title}"?`}
        confirmLabel="Delete Task"
        danger={true}
        loading={isDeleting}
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
