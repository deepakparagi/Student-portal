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
    const timeoutId = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeoutId);
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
      setSuccess("Adaptive study plan generated based on your processed notes.");
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
      setSuccess(`Task "${body.title}" added to your schedule.`);
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

  async function handleClearAllTasks() {
    if (!window.confirm("Are you sure you want to delete all tasks?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API}/tasks`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Could not delete tasks.");
      setTasks([]);
      setSuccess("All study tasks deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete all tasks.");
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
    <div className="min-h-screen flex flex-col bg-brand-primary text-brand-neutral">
      <Navbar />

      <main id="main-content" className="app-container page-wrapper flex-1 py-8">
        {/* Page Header */}
        <PageHeader
          eyebrow="Adaptive Study Planning"
          eyebrowIcon={<Sparkles size={13} className="text-brand-neutral" />}
          title="Daily Study Plan"
          description="Adaptive study blocks generated from your notes, balanced against your daily study time."
          actions={
            <div className="flex items-center gap-2">
              {tasks.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllTasks}
                  disabled={isDeleting}
                  icon={<Trash2 size={13} className="text-rose-400" />}
                  className="text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/30"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPlanConfig(!showPlanConfig)}
                icon={<RotateCw size={13} />}
                className="text-xs"
              >
                {showPlanConfig ? "Hide Config" : "Regenerate Plan"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                icon={<Plus size={14} />}
                className="text-xs"
              >
                Add Task
              </Button>
            </div>
          }
        />

        {/* Notices */}
        {success && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-6"
          >
            <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs font-medium mb-6"
          >
            <span>{error}</span>
          </div>
        )}

        {/* Progress Strip */}
        <div className="p-4 rounded-xl bg-brand-secondary border border-brand-neutral/20 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono text-brand-muted uppercase tracking-wider">
              Overall Completion
            </span>
            <div className="text-base font-semibold text-brand-light mt-0.5">
              {completedCount} of {totalCount} Tasks Done ({completionPercent}%)
            </div>
          </div>

          <div className="w-full sm:w-48 h-2 rounded-full bg-brand-raised overflow-hidden">
            <div
              className="h-full bg-brand-accent rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Plan Configuration Dropdown */}
        {showPlanConfig && (
          <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/30 mb-6 animate-fade-in">
            <h3 className="text-sm font-semibold text-brand-light mb-1">
              Configure Adaptive Study Schedule
            </h3>
            <p className="text-xs text-brand-neutral mb-4">
              Set your target daily available study time. The planner balances sessions across all your uploaded notes.
            </p>

            <form onSubmit={handlePlanSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="w-full sm:w-48">
                <label className="block text-xs font-medium text-brand-neutral mb-1.5">
                  Daily Study Time (mins)
                </label>
                <input
                  name="minutes"
                  type="number"
                  min={15}
                  max={360}
                  step={15}
                  defaultValue={plan?.dailyAvailableMinutes || 60}
                  className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light focus:outline-none focus:border-brand-neutral/40 transition-colors"
                />
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-xs font-medium text-brand-neutral mb-1.5">
                  Start Date
                </label>
                <input
                  name="startDate"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light focus:outline-none focus:border-brand-neutral/40 transition-colors"
                />
              </div>

              <Button type="submit" variant="primary" loading={busy} className="text-xs h-[38px] px-4">
                Generate Plan
              </Button>
            </form>
          </div>
        )}

        {/* Add Task Form Inline */}
        {showAddForm && (
          <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/25 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-semibold text-brand-light">Create Study Task</h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-brand-muted hover:text-brand-neutral transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={createTask} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-brand-neutral mb-1">Task Title</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Read Chapter 4 and complete recall exercises"
                  className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light placeholder:text-brand-muted focus:outline-none focus:border-brand-neutral/40 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-neutral mb-1">Subject</label>
                <input
                  name="subject"
                  type="text"
                  placeholder="e.g. Biology, Calculus, History"
                  className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light placeholder:text-brand-muted focus:outline-none focus:border-brand-neutral/40 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-neutral mb-1">Estimated Duration</label>
                <select name="duration" defaultValue={25} className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light focus:outline-none focus:border-brand-neutral/40 transition-colors">
                  <option value={15}>15 mins (Quick review)</option>
                  <option value={25}>25 mins (Pomodoro block)</option>
                  <option value={45}>45 mins (Deep study)</option>
                  <option value={60}>60 mins (Intense session)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-neutral mb-1">Priority</label>
                <select name="priority" defaultValue="NORMAL" className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light focus:outline-none focus:border-brand-neutral/40 transition-colors">
                  <option value="NORMAL">Normal Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-neutral mb-1">Scheduled Date</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-2 text-xs text-brand-light focus:outline-none focus:border-brand-neutral/40 transition-colors"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="text-xs">
                  Save Task
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Task List Grouped by Day */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton height="64px" />
            <Skeleton height="64px" />
            <Skeleton height="64px" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No study tasks scheduled"
            description="Generate a daily study plan from your uploaded notes or create custom tasks."
            action={
              <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)} icon={<Plus size={14} />}>
                Create Your First Task
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([groupTitle, groupTasks]) => (
              <section key={groupTitle}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Calendar size={13} className="text-brand-neutral" />
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      groupTitle === "Overdue" ? "text-rose-400" : "text-brand-neutral"
                    }`}
                  >
                    {groupTitle} ({groupTasks.filter((t) => t.status === "COMPLETED").length}/{groupTasks.length} Done)
                  </h3>
                  {groupTitle === "Overdue" && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      Overdue
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {groupTasks.map((task) => {
                    const isDone = task.status === "COMPLETED";
                    const isHigh = task.priority === "HIGH";
                    const isMed = task.priority === "MEDIUM";

                    if (editing?.id === task.id) {
                      return (
                        <form
                          key={task.id}
                          onSubmit={(e) => updateTask(e, task)}
                          className="p-3.5 rounded-lg bg-brand-secondary border border-brand-neutral/40 space-y-2.5"
                        >
                          <input
                            name="title"
                            defaultValue={task.title}
                            required
                            className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-1.5 text-xs text-brand-light focus:outline-none focus:border-brand-neutral/40"
                          />
                          <div className="flex flex-wrap gap-2">
                            <input
                              name="subject"
                              defaultValue={task.subject}
                              placeholder="Subject"
                              className="flex-1 min-w-[140px] bg-brand-raised border border-brand-neutral/25 rounded-lg px-3 py-1.5 text-xs text-brand-light focus:outline-none focus:border-brand-neutral/40"
                            />
                            <select
                              name="priority"
                              defaultValue={task.priority}
                              className="w-28 bg-brand-raised border border-brand-neutral/25 rounded-lg px-2 py-1.5 text-xs text-brand-light"
                            >
                              <option value="NORMAL">Normal</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                            </select>
                            <Button type="submit" variant="primary" size="sm" className="text-xs py-1 px-3">
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="text-xs py-1 px-3">
                              Cancel
                            </Button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <article
                        key={task.id}
                        className={`flex items-center justify-between gap-3 p-3.5 rounded-lg bg-brand-secondary border transition-colors ${
                          isDone
                            ? "border-brand-neutral/20 opacity-60"
                            : "border-brand-neutral/20 hover:border-brand-neutral/30"
                        }`}
                      >
                        {/* Checkbox & Details */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => void toggleComplete(task)}
                            aria-label={`Mark "${task.title}" as ${isDone ? "incomplete" : "complete"}`}
                            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isDone
                                ? "bg-emerald-500 border-emerald-500 text-brand-light"
                                : "border-brand-neutral/30 hover:border-brand-neutral/40 bg-transparent"
                            }`}
                          >
                            {isDone && <Check size={12} strokeWidth={3} />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`text-xs sm:text-sm font-medium truncate ${
                                  isDone ? "line-through text-brand-muted" : "text-brand-neutral"
                                }`}
                              >
                                {task.title}
                              </h4>
                              {isHigh && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  High
                                </span>
                              )}
                              {isMed && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Med
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-brand-muted mt-0.5">
                              {task.subject && <span>{task.subject}</span>}
                              <span>&bull; {task.estimatedMinutes} mins</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isDone && (
                            <Button
                              variant="secondary"
                              size="sm"
                              href={`/focus?taskId=${task.id}`}
                              icon={<Play size={12} />}
                              className="text-xs py-1 px-2.5"
                            >
                              Focus
                            </Button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditing(task)}
                            aria-label={`Edit ${task.title}`}
                            className="w-7 h-7 rounded flex items-center justify-center text-brand-muted hover:text-brand-neutral hover:bg-brand-raised transition-colors"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(task)}
                            aria-label={`Delete ${task.title}`}
                            className="w-7 h-7 rounded flex items-center justify-center text-brand-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 size={13} />
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

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showRegenConfirm}
        title="Regenerate Study Plan?"
        description="Regenerating your study plan will recalculate daily sessions from your notes and replace current uncompleted tasks. Completed tasks will remain in your history."
        confirmLabel="Regenerate"
        danger={false}
        loading={busy}
        onConfirm={() => executePlanGeneration(pendingRegenForm || undefined)}
        onCancel={() => setShowRegenConfirm(false)}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Study Task?"
        description={`Are you sure you want to remove "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        danger={true}
        loading={isDeleting}
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
