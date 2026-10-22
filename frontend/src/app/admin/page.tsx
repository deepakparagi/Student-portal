"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Server,
  FileText,
  Activity,
  Award,
  Clock,
  Search,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Lock,
  History,
  HardDrive,
  Check,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "../navbar";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";

type CurrentAdmin = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  materialsCount?: number;
  quizAttemptsCount?: number;
  studyMinutes?: number;
};

type DocumentRecord = {
  id: number;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  processingError?: string;
  createdAt: string;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
};

type ActivityFeed = {
  quizzes: {
    id: number;
    studentName: string;
    quizTitle: string;
    score: number;
    total: number;
    accuracyPercent: number;
    submittedAt: string;
  }[];
  sessions: {
    id: number;
    studentName: string;
    durationMinutes: number;
    status: string;
    startedAt: string;
  }[];
  users: {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
};

type System = {
  users: number;
  students: number;
  parents: number;
  admins: number;
  totalMaterials: number;
  documentProcessing: Record<string, number>;
  totalQuizzes: number;
  quizAttempts: number;
  avgQuizAccuracyPercent: number;
  totalStudyMinutes: number;
  totalStudyHours: number;
  completedSessions: number;
  totalTasks: number;
  completedTasks: number;
  serverTelemetry: {
    jvmUsedMemoryMB: number;
    jvmTotalMemoryMB: number;
    jvmMaxMemoryMB: number;
    memoryUsagePercent: number;
    availableProcessors: number;
    javaVersion: string;
    serverTime: string;
    mlEngineStatus: string;
  };
  mode: string;
};

type AuditEntry = {
  id: string;
  timestamp: string;
  action: string;
  targetUser: string;
  details: string;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} mins`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${h} hr${h > 1 ? "s" : ""}` : `${h} hr ${rem} min`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminPage() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activity, setActivity] = useState<ActivityFeed | null>(null);
  const [system, setSystem] = useState<System | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  // Audit Log State
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([
    {
      id: "init-1",
      timestamp: new Date().toLocaleTimeString(),
      action: "TELEMETRY_CONNECTED",
      targetUser: "System Monitor",
      details: "Administrator session established and real-time metric streams connected.",
    },
  ]);

  // User table search, filtering, sorting, pagination
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<keyof User>("createdAt");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;

  // Document pipeline search & filter
  const [docSearch, setDocSearch] = useState<string>("");
  const [docStatusFilter, setDocStatusFilter] = useState<string>("ALL");

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"users" | "documents" | "activity" | "telemetry">("users");

  // Confirmation Modals
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: User;
    newRole: string;
  } | null>(null);
  const [pendingToggleStatus, setPendingToggleStatus] = useState<User | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [meRes, uRes, sRes, dRes, aRes] = await Promise.all([
        fetch(`${API}/auth/me`, { credentials: "include" }),
        fetch(`${API}/admin/users`, { credentials: "include" }),
        fetch(`${API}/admin/system`, { credentials: "include" }),
        fetch(`${API}/admin/documents`, { credentials: "include" }),
        fetch(`${API}/admin/recent-activity`, { credentials: "include" }),
      ]);

      if (uRes.status === 401 || sRes.status === 401) {
        router.push("/login");
        return;
      }

      if (!uRes.ok || !sRes.ok) {
        throw new Error("This area requires verified administrator privileges.");
      }

      if (meRes.ok) {
        setCurrentAdmin((await meRes.json()) as CurrentAdmin);
      }
      setUsers(await uRes.json());
      setSystem(await sRes.json());
      if (dRes.ok) setDocuments(await dRes.json());
      if (aRes.ok) setActivity(await aRes.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load admin monitoring data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    setNotice("");
    await loadData();
  }

  async function executeRoleChange() {
    if (!pendingRoleChange) return;
    const { user, newRole } = pendingRoleChange;
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API}/admin/users/${user.id}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update role.");
      setUsers((curr) => curr.map((u) => (u.id === user.id ? { ...u, role: result.role } : u)));
      const msg = `Updated ${user.name}'s role to ${newRole}.`;
      setNotice(result.notice || msg);

      setAuditLog((prev) => [
        {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString(),
          action: "ROLE_CHANGE",
          targetUser: user.name,
          details: `Role updated from ${user.role} to ${newRole} by ${currentAdmin?.name ?? "Admin"}.`,
        },
        ...prev,
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to change user role.");
    } finally {
      setPendingRoleChange(null);
    }
  }

  async function executeToggleStatus() {
    if (!pendingToggleStatus) return;
    const user = pendingToggleStatus;
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API}/admin/users/${user.id}/toggle-status`, {
        method: "PATCH",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not toggle status.");
      setUsers((curr) => curr.map((u) => (u.id === user.id ? { ...u, enabled: result.enabled } : u)));
      setNotice(result.message);

      setAuditLog((prev) => [
        {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString(),
          action: result.enabled ? "ACCOUNT_ACTIVATED" : "ACCOUNT_SUSPENDED",
          targetUser: user.name,
          details: `Account ${result.enabled ? "activated" : "suspended"} by ${currentAdmin?.name ?? "Admin"}.`,
        },
        ...prev,
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to toggle status.");
    } finally {
      setPendingToggleStatus(null);
    }
  }

  async function handleSwitchToAdmin() {
    setLoading(true);
    setError("");
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@test.com", password: "Password123!" }),
      });
      if (res.ok) {
        await loadData();
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  // Filtered & sorted users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string" && typeof valB === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      const numA = Number(valA ?? 0);
      const numB = Number(valB ?? 0);
      return sortAsc ? numA - numB : numB - numA;
    });
  }, [filteredUsers, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, page, pageSize]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !docSearch ||
        doc.title.toLowerCase().includes(docSearch.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(docSearch.toLowerCase()) ||
        doc.ownerName.toLowerCase().includes(docSearch.toLowerCase());
      const matchesStatus = docStatusFilter === "ALL" || doc.status === docStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, docSearch, docStatusFilter]);

  function handleSort(field: keyof User) {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-primary text-brand-neutral">
      <Navbar />

      <main className="app-container page-wrapper flex-1 py-8">
        <PageHeader
          eyebrow="Platform Governance & Telemetry"
          eyebrowIcon={<Server size={13} className="text-brand-neutral" />}
          title="Admin Operations"
          description="Unified control plane for accounts, document ingestion queues, microservice diagnostics, and throughput."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleRefresh()}
              loading={refreshing}
              icon={<RefreshCw size={13} />}
              className="text-xs"
            >
              Refresh
            </Button>
          }
        />

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 mb-6 flex items-start gap-3">
            <ShieldAlert size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-brand-light">Administrator Access Required</h3>
              <p className="text-xs text-brand-neutral mt-1 mb-3">
                {error} Please authenticate with an Administrator account (e.g. <code>admin@test.com</code> / <code>Password123!</code>).
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleSwitchToAdmin()}
                icon={<ShieldCheck size={13} />}
                className="text-xs py-1 px-3"
              >
                Sign In as Admin (admin@test.com)
              </Button>
            </div>
          </div>
        )}

        {notice && (
          <div role="status" className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-6">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-brand-muted text-xs">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-brand-neutral" />
            <p>Connecting to system metrics and telemetry streams...</p>
          </div>
        ) : system ? (
          <div className="space-y-6">
            {/* Primary KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <StatCard
                label="Registered Accounts"
                value={system.users}
                icon={Users}
                iconColor="#7692FF"
                subtext={`${system.students} Students • ${system.parents} Parents • ${system.admins} Admins`}
              />

              <StatCard
                label="Total Study Volume"
                value={system.totalStudyHours}
                unit="hrs"
                icon={Clock}
                iconColor="#10b981"
                subtext={`${system.completedSessions} sessions logged platform-wide`}
              />

              <StatCard
                label="Document Pipeline"
                value={system.totalMaterials}
                unit="docs"
                icon={FileText}
                iconColor="#ABD2FA"
                subtext={`${system.documentProcessing["COMPLETED"] ?? 0} Completed • ${system.documentProcessing["FAILED"] ?? 0} Failed`}
              />

              <StatCard
                label="Quiz Accuracy Avg"
                value={`${system.avgQuizAccuracyPercent}%`}
                icon={Award}
                iconColor="#f59e0b"
                subtext={`${system.quizAttempts} attempts evaluated platform-wide`}
              />
            </div>

            {/* Diagnostic Telemetry Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* JVM Memory */}
              <div className="p-3.5 rounded-xl bg-brand-secondary border border-brand-neutral/20 flex items-center gap-3">
                <Cpu size={18} className="text-brand-neutral shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-brand-muted block">JVM Heap</span>
                  <div className="text-xs font-semibold text-brand-neutral mt-0.5">
                    {system.serverTelemetry.jvmUsedMemoryMB}MB / {system.serverTelemetry.jvmMaxMemoryMB}MB
                  </div>
                  <div className="mt-1.5 w-full h-1 bg-brand-raised rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-accent rounded-full"
                      style={{ width: `${Math.min(100, system.serverTelemetry.memoryUsagePercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ML Engine */}
              <div className="p-3.5 rounded-xl bg-brand-secondary border border-brand-neutral/20 flex items-center gap-3">
                <Activity size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-brand-muted block">FastAPI ML</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-neutral mt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        system.serverTelemetry.mlEngineStatus === "ONLINE" ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span>{system.serverTelemetry.mlEngineStatus} (8000)</span>
                  </div>
                </div>
              </div>

              {/* Runtime Environment */}
              <div className="p-3.5 rounded-xl bg-brand-secondary border border-brand-neutral/20 flex items-center gap-3">
                <Server size={18} className="text-brand-neutral shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-brand-muted block">Host Runtime</span>
                  <div className="text-xs font-semibold text-brand-neutral mt-0.5">
                    JDK {system.serverTelemetry.javaVersion} • {system.serverTelemetry.availableProcessors} Cores
                  </div>
                </div>
              </div>

              {/* Architecture */}
              <div className="p-3.5 rounded-xl bg-brand-secondary border border-brand-neutral/20 flex items-center gap-3">
                <HardDrive size={18} className="text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-brand-muted block">Database</span>
                  <div className="text-xs font-semibold text-brand-neutral mt-0.5">
                    MySQL (Port 3307)
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div role="tablist" className="flex border-b border-brand-neutral/20 gap-2 overflow-x-auto pb-0.5">
              {[
                { key: "users", label: `User Directory (${users.length})`, icon: Users },
                { key: "documents", label: `Document Pipeline (${documents.length})`, icon: FileText },
                { key: "activity", label: "Platform Activity", icon: Activity },
                { key: "telemetry", label: "Diagnostics & Audit Log", icon: Cpu },
              ].map((tab) => {
                const active = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                      active
                        ? "border-brand-neutral/40 text-brand-neutral"
                        : "border-transparent text-brand-muted hover:text-brand-neutral"
                    }`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: User Management */}
            {activeTab === "users" && (
              <div className="space-y-3">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search accounts by name or email..."
                      className="w-full bg-brand-raised border border-brand-neutral/25 rounded-lg pl-8 pr-3 py-1.5 text-xs text-brand-light placeholder:text-brand-muted focus:outline-none focus:border-brand-neutral/40"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-muted">Role:</span>
                    <select
                      value={roleFilter}
                      aria-label="Filter user accounts by role"
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setPage(1);
                      }}
                      className="bg-brand-raised border border-brand-neutral/25 rounded-lg px-2.5 py-1.5 text-xs text-brand-light focus:outline-none focus:border-brand-neutral/40"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="STUDENT">Student</option>
                      <option value="PARENT">Parent</option>
                      <option value="ADMIN">Admin</option>
                    </select>

                    <span className="text-xs text-brand-muted ml-2 font-mono">
                      {sortedUsers.length} total
                    </span>
                  </div>
                </div>

                {/* Users Table */}
                <div className="rounded-xl bg-brand-secondary border border-brand-neutral/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-brand-neutral/20 text-[11px] font-mono uppercase tracking-wider text-brand-muted bg-brand-raised">
                          <th onClick={() => handleSort("name")} className="p-3 cursor-pointer">
                            <span className="inline-flex items-center gap-1">User <ArrowUpDown size={11} /></span>
                          </th>
                          <th onClick={() => handleSort("role")} className="p-3 cursor-pointer">
                            <span className="inline-flex items-center gap-1">Role <ArrowUpDown size={11} /></span>
                          </th>
                          <th onClick={() => handleSort("materialsCount")} className="p-3 cursor-pointer">
                            <span className="inline-flex items-center gap-1">Docs <ArrowUpDown size={11} /></span>
                          </th>
                          <th onClick={() => handleSort("quizAttemptsCount")} className="p-3 cursor-pointer">
                            <span className="inline-flex items-center gap-1">Quizzes <ArrowUpDown size={11} /></span>
                          </th>
                          <th onClick={() => handleSort("studyMinutes")} className="p-3 cursor-pointer">
                            <span className="inline-flex items-center gap-1">Study Time <ArrowUpDown size={11} /></span>
                          </th>
                          <th onClick={() => handleSort("enabled")} className="p-3 cursor-pointer">
                            <span className="inline-flex items-center gap-1">Status <ArrowUpDown size={11} /></span>
                          </th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-neutral/20">
                        {paginatedUsers.map((u) => {
                          const isSelf = currentAdmin?.id === u.id;
                          const isLastAdmin = u.role === "ADMIN" && (system?.admins ?? 0) <= 1;

                          return (
                            <tr key={u.id} className="hover:bg-brand-raised/50 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <strong className="text-brand-neutral font-medium">{u.name}</strong>
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-accent/20 text-brand-light font-mono">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-brand-muted block mt-0.5">{u.email}</span>
                              </td>

                              <td className="p-3">
                                <select
                                  value={u.role}
                                  aria-label={`Select role for ${u.name}`}
                                  disabled={isSelf}
                                  onChange={(e) => {
                                    const newRole = e.target.value;
                                    if (newRole !== u.role) {
                                      setPendingRoleChange({ user: u, newRole });
                                    }
                                  }}
                                  className="bg-brand-raised border border-brand-neutral/25 rounded px-2 py-1 text-xs text-brand-neutral focus:outline-none focus:border-brand-neutral/40 disabled:opacity-60"
                                >
                                  <option value="STUDENT">STUDENT</option>
                                  <option value="PARENT">PARENT</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>
                              </td>

                              <td className="p-3 text-brand-neutral font-mono">{u.materialsCount ?? 0}</td>
                              <td className="p-3 text-brand-neutral font-mono">{u.quizAttemptsCount ?? 0}</td>
                              <td className="p-3 text-brand-neutral font-mono">{formatDuration(u.studyMinutes ?? 0)}</td>

                              <td className="p-3">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                    u.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                  }`}
                                >
                                  {u.enabled ? "ACTIVE" : "SUSPENDED"}
                                </span>
                              </td>

                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  disabled={isSelf || (isLastAdmin && u.enabled)}
                                  onClick={() => setPendingToggleStatus(u)}
                                  className={`text-xs ${
                                    u.enabled ? "text-rose-400 hover:text-rose-300" : "text-emerald-400 hover:text-emerald-300"
                                  } disabled:opacity-40 transition-colors`}
                                >
                                  {u.enabled ? "Suspend" : "Activate"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="p-3 border-t border-brand-neutral/20 flex items-center justify-between text-xs text-brand-muted">
                      <span>Page {page} of {totalPages}</span>
                      <div className="flex gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="text-xs py-1 px-2.5"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className="text-xs py-1 px-2.5"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Document Pipeline */}
            {activeTab === "documents" && (
              <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/20 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-light">Document Processing Pipeline</h3>
                    <p className="text-xs text-brand-muted mt-0.5">Live extraction and summarization monitor</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      placeholder="Filter title or owner..."
                      className="bg-brand-raised border border-brand-neutral/25 rounded-lg px-2.5 py-1.5 text-xs text-brand-light placeholder:text-brand-muted focus:outline-none focus:border-brand-neutral/40"
                    />
                    <select
                      value={docStatusFilter}
                      aria-label="Filter documents by ingestion status"
                      onChange={(e) => setDocStatusFilter(e.target.value)}
                      className="bg-brand-raised border border-brand-neutral/25 rounded-lg px-2 py-1.5 text-xs text-brand-light focus:outline-none focus:border-brand-neutral/40"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-neutral/20 text-[11px] font-mono uppercase tracking-wider text-brand-muted">
                        <th className="py-2.5 px-3">Document</th>
                        <th className="py-2.5 px-3">Owner</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Details</th>
                        <th className="py-2.5 px-3">Uploaded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-neutral/20">
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-brand-raised/50">
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-brand-neutral block">{doc.title}</span>
                            <span className="text-[11px] text-brand-muted">{doc.fileName}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-brand-neutral block">{doc.ownerName}</span>
                            <span className="text-[11px] text-brand-muted">{doc.ownerEmail}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-brand-neutral">{formatFileSize(doc.fileSize)}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                doc.status === "COMPLETED"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : doc.status === "FAILED"
                                  ? "bg-rose-500/10 text-rose-400"
                                  : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-brand-neutral text-[11px] max-w-xs truncate">
                            {doc.processingError ? doc.processingError : "Verified"}
                          </td>
                          <td className="py-2.5 px-3 text-brand-muted font-mono text-[11px]">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Activity Feed */}
            {activeTab === "activity" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recent Quizzes */}
                <div className="p-4 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                  <h3 className="text-xs font-semibold text-brand-neutral mb-3 flex items-center gap-1.5">
                    <Award size={13} className="text-brand-neutral" /> Recent Quizzes
                  </h3>
                  {activity?.quizzes && activity.quizzes.length > 0 ? (
                    <div className="space-y-2">
                      {activity.quizzes.map((q) => (
                        <div key={q.id} className="p-2 rounded bg-brand-raised text-xs">
                          <div className="flex justify-between font-medium text-brand-neutral">
                            <span className="truncate mr-2">{q.studentName}</span>
                            <span className="font-mono text-brand-neutral">{q.score}/{q.total}</span>
                          </div>
                          <span className="text-[11px] text-brand-muted truncate block mt-0.5">{q.quizTitle}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted">No recent quizzes.</p>
                  )}
                </div>

                {/* Recent Sessions */}
                <div className="p-4 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                  <h3 className="text-xs font-semibold text-brand-neutral mb-3 flex items-center gap-1.5">
                    <Clock size={13} className="text-emerald-400" /> Recent Focus Sessions
                  </h3>
                  {activity?.sessions && activity.sessions.length > 0 ? (
                    <div className="space-y-2">
                      {activity.sessions.map((s) => (
                        <div key={s.id} className="p-2 rounded bg-brand-raised text-xs">
                          <div className="flex justify-between font-medium text-brand-neutral">
                            <span className="truncate mr-2">{s.studentName}</span>
                            <span className="font-mono text-emerald-400">{s.durationMinutes}m</span>
                          </div>
                          <span className="text-[11px] text-brand-muted block mt-0.5">
                            {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted">No recent sessions.</p>
                  )}
                </div>

                {/* Recent Users */}
                <div className="p-4 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                  <h3 className="text-xs font-semibold text-brand-neutral mb-3 flex items-center gap-1.5">
                    <Users size={13} className="text-brand-neutral" /> New Accounts
                  </h3>
                  {activity?.users && activity.users.length > 0 ? (
                    <div className="space-y-2">
                      {activity.users.map((u) => (
                        <div key={u.id} className="p-2 rounded bg-brand-raised text-xs">
                          <div className="flex justify-between font-medium text-brand-neutral">
                            <span className="truncate mr-2">{u.name}</span>
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-brand-secondary text-brand-neutral">{u.role}</span>
                          </div>
                          <span className="text-[11px] text-brand-muted truncate block mt-0.5">{u.email}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted">No recent accounts.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Telemetry Diagnostics */}
            {activeTab === "telemetry" && (
              <div className="space-y-4">
                {/* Audit Log */}
                <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                  <div className="flex items-center gap-2 mb-3">
                    <History size={15} className="text-brand-neutral" />
                    <h3 className="text-xs font-semibold text-brand-light">Security Audit Log</h3>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 rounded bg-brand-raised text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-brand-accent/20 text-brand-light shrink-0">
                            {entry.action}
                          </span>
                          <span className="text-brand-neutral truncate">{entry.details}</span>
                        </div>
                        <span className="text-[11px] font-mono text-brand-muted shrink-0">{entry.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Host Diagnostics */}
                <div className="p-5 rounded-xl bg-brand-secondary border border-brand-neutral/20">
                  <h3 className="text-xs font-semibold text-brand-light mb-3">Host Diagnostics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-brand-raised">
                      <span className="text-[10px] font-mono text-brand-muted uppercase">JVM Heap</span>
                      <div className="text-xs font-semibold text-brand-neutral mt-1">
                        {system.serverTelemetry.jvmUsedMemoryMB}MB / {system.serverTelemetry.jvmMaxMemoryMB}MB
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-brand-raised">
                      <span className="text-[10px] font-mono text-brand-muted uppercase">ML Microservice</span>
                      <div className="text-xs font-semibold text-emerald-400 mt-1">
                        {system.serverTelemetry.mlEngineStatus} (Port 8000)
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-brand-raised">
                      <span className="text-[10px] font-mono text-brand-muted uppercase">Host Cores</span>
                      <div className="text-xs font-semibold text-brand-neutral mt-1">
                        {system.serverTelemetry.availableProcessors} Cores (JDK {system.serverTelemetry.javaVersion})
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-brand-raised">
                      <span className="text-[10px] font-mono text-brand-muted uppercase">System Time</span>
                      <div className="text-xs font-semibold text-brand-neutral mt-1">
                        {new Date(system.serverTelemetry.serverTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Confirmation Dialogs */}
      {pendingRoleChange && (
        <ConfirmDialog
          isOpen={true}
          title="Change User Access Role?"
          description={`Are you sure you want to change ${pendingRoleChange.user.name}'s role to ${pendingRoleChange.newRole}?`}
          confirmLabel={`Set Role to ${pendingRoleChange.newRole}`}
          danger={pendingRoleChange.newRole !== "ADMIN" && pendingRoleChange.user.role === "ADMIN"}
          onConfirm={() => void executeRoleChange()}
          onCancel={() => setPendingRoleChange(null)}
        />
      )}

      {pendingToggleStatus && (
        <ConfirmDialog
          isOpen={true}
          title={pendingToggleStatus.enabled ? "Suspend Account?" : "Activate Account?"}
          description={
            pendingToggleStatus.enabled
              ? `Are you sure you want to suspend ${pendingToggleStatus.name}'s account?`
              : `Are you sure you want to activate ${pendingToggleStatus.name}'s account?`
          }
          confirmLabel={pendingToggleStatus.enabled ? "Suspend" : "Activate"}
          danger={pendingToggleStatus.enabled}
          onConfirm={() => void executeToggleStatus()}
          onCancel={() => setPendingToggleStatus(null)}
        />
      )}
    </div>
  );
}
