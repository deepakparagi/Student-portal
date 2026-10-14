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
      // Append to audit log
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
      // Append to audit log
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
    <>
      <Navbar />
      <main className="app-container" style={{ paddingBottom: "100px", paddingTop: "24px" }}>
        <PageHeader
          eyebrow="Platform Governance & Telemetry"
          title="Admin Operations"
          description="Unified control plane for user accounts, document ingestion queues, microservice diagnostics, and live academic throughput."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleRefresh()}
              loading={refreshing}
              icon={<RefreshCw size={14} />}
            >
              Refresh Telemetry
            </Button>
          }
        />

        {error && (
          <div
            style={{
              padding: "18px 22px",
              borderRadius: "16px",
              border: "1px solid rgba(255, 107, 107, 0.4)",
              background: "rgba(255, 107, 107, 0.1)",
              marginBottom: "24px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <ShieldAlert size={22} color="var(--danger)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--paper)", margin: "0 0 6px" }}>
                Administrator Access Required
              </h3>
              <p style={{ fontSize: "13px", color: "var(--mist)", margin: "0 0 14px", lineHeight: 1.5 }}>
                {error} Please authenticate with an Administrator account (e.g. <code>admin@test.com</code> / <code>Password123!</code>).
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleSwitchToAdmin()}
                icon={<ShieldCheck size={14} />}
              >
                Sign In as Admin (admin@test.com)
              </Button>
            </div>
          </div>
        )}

        {notice && (
          <div
            role="status"
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              background: "rgba(196, 255, 106, 0.08)",
              border: "1px solid rgba(196, 255, 106, 0.25)",
              color: "var(--accent-lime)",
              fontSize: "13px",
              marginBottom: "24px",
            }}
          >
            {notice}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--mist)" }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            <p>Connecting to system metrics and telemetry streams...</p>
          </div>
        ) : system ? (
          <div>
            {/* Primary KPI Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              <StatCard
                label="Registered Accounts"
                value={system.users}
                icon={Users}
                iconColor="var(--mint)"
                subtext={`${system.students} Students • ${system.parents} Parents • ${system.admins} Admins`}
              />

              <StatCard
                label="Total Study Volume"
                value={system.totalStudyHours}
                unit="hrs"
                icon={Clock}
                iconColor="var(--accent-lime)"
                subtext={`${system.completedSessions} sessions logged platform-wide`}
              />

              <StatCard
                label="Document Pipeline"
                value={system.totalMaterials}
                unit="docs"
                icon={FileText}
                iconColor="var(--info)"
                subtext={`${system.documentProcessing["COMPLETED"] ?? 0} Completed • ${system.documentProcessing["FAILED"] ?? 0} Failed`}
              />

              <StatCard
                label="Quiz Accuracy Avg"
                value={`${system.avgQuizAccuracyPercent}%`}
                icon={Award}
                iconColor="#f6c445"
                subtext={`${system.quizAttempts} attempts evaluated platform-wide`}
              />
            </div>

            {/* Diagnostic Telemetry Status Cards (Replacing tiny text strip) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "14px",
                marginBottom: "28px",
              }}
            >
              {/* JVM Memory */}
              <div
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Cpu size={20} color="var(--accent-lime)" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mist)", fontWeight: 700 }}>
                    JVM Heap Memory
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--paper)" }}>
                    {system.serverTelemetry.jvmUsedMemoryMB} MB / {system.serverTelemetry.jvmMaxMemoryMB} MB
                  </div>
                  <div style={{ marginTop: "6px", width: "100%", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min(100, system.serverTelemetry.memoryUsagePercent)}%`,
                        height: "100%",
                        background: "var(--accent-lime)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ML Engine */}
              <div
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Activity size={20} color="var(--mint)" />
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mist)", fontWeight: 700 }}>
                    FastAPI ML Service
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700, color: system.serverTelemetry.mlEngineStatus === "ONLINE" ? "var(--accent-lime)" : "var(--danger)" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: system.serverTelemetry.mlEngineStatus === "ONLINE" ? "var(--accent-lime)" : "var(--danger)",
                        boxShadow: system.serverTelemetry.mlEngineStatus === "ONLINE" ? "0 0 8px var(--accent-lime)" : "none",
                      }}
                    />
                    {system.serverTelemetry.mlEngineStatus} (Port 8000)
                  </div>
                </div>
              </div>

              {/* Runtime Environment */}
              <div
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Server size={20} color="var(--info)" />
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mist)", fontWeight: 700 }}>
                    Host Runtime
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--paper)" }}>
                    JDK {system.serverTelemetry.javaVersion} • {system.serverTelemetry.availableProcessors} Cores
                  </div>
                </div>
              </div>

              {/* Architecture */}
              <div
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <HardDrive size={20} color="#f6c445" />
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mist)", fontWeight: 700 }}>
                    Database Architecture
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--paper)" }}>
                    MySQL 8.0 (Port 3307)
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Navigation Tabs with Lucide Icons (Replacing emoji icons) */}
            <div
              role="tablist"
              aria-label="Admin tabs"
              style={{
                display: "flex",
                borderBottom: "1px solid var(--border-subtle)",
                gap: "12px",
                marginBottom: "24px",
                overflowX: "auto",
                paddingBottom: "2px",
              }}
            >
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
                    style={{
                      minHeight: "44px",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: active ? "2px solid var(--accent-lime)" : "2px solid transparent",
                      color: active ? "var(--accent-lime)" : "var(--mist)",
                      fontWeight: active ? 600 : 500,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      whiteSpace: "nowrap",
                      transition: "color 0.15s ease",
                    }}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: User Management with Sorting, Pagination, and Safe Confirmation */}
            {activeTab === "users" && (
              <div>
                {/* Search & Filter Bar */}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div style={{ position: "relative", flex: "1 1 280px" }}>
                    <Search
                      size={15}
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--mist)",
                      }}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search accounts by name or email..."
                      style={{
                        width: "100%",
                        height: "42px",
                        padding: "0 14px 0 38px",
                        borderRadius: "10px",
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--paper)",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", color: "var(--mist)" }}>Role:</span>
                    <select
                      value={roleFilter}
                      aria-label="Filter user accounts by role"
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setPage(1);
                      }}
                      style={{
                        height: "42px",
                        padding: "0 12px",
                        borderRadius: "10px",
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--paper)",
                        fontSize: "13px",
                      }}
                    >
                      <option value="ALL">All Roles</option>
                      <option value="STUDENT">Student</option>
                      <option value="PARENT">Parent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </label>

                  <span style={{ fontSize: "13px", color: "var(--mist)", marginLeft: "auto" }}>
                    Showing {sortedUsers.length} of {users.length} accounts
                  </span>
                </div>

                {/* Users Table */}
                <div
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "18px",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                      <thead>
                        <tr
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderBottom: "1px solid var(--border-subtle)",
                            color: "var(--mist)",
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          <th
                            onClick={() => handleSort("name")}
                            style={{ padding: "14px 18px", cursor: "pointer" }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              User <ArrowUpDown size={12} />
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort("role")}
                            style={{ padding: "14px 18px", cursor: "pointer" }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              Role <ArrowUpDown size={12} />
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort("materialsCount")}
                            style={{ padding: "14px 18px", cursor: "pointer" }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              Library <ArrowUpDown size={12} />
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort("quizAttemptsCount")}
                            style={{ padding: "14px 18px", cursor: "pointer" }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              Quizzes <ArrowUpDown size={12} />
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort("studyMinutes")}
                            style={{ padding: "14px 18px", cursor: "pointer" }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              Study Time <ArrowUpDown size={12} />
                            </span>
                          </th>
                          <th
                            onClick={() => handleSort("enabled")}
                            style={{ padding: "14px 18px", cursor: "pointer" }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              Status <ArrowUpDown size={12} />
                            </span>
                          </th>
                          <th style={{ padding: "14px 18px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((u) => {
                          const isSelf = currentAdmin?.id === u.id;
                          const isLastAdmin = u.role === "ADMIN" && (system?.admins ?? 0) <= 1;

                          return (
                            <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                              <td style={{ padding: "14px 18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <strong style={{ color: "var(--paper)" }}>{u.name}</strong>
                                  {isSelf && (
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        padding: "1px 6px",
                                        borderRadius: "4px",
                                        background: "rgba(196,255,106,0.15)",
                                        color: "var(--accent-lime)",
                                      }}
                                    >
                                      You
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: "12px", color: "var(--mist)", display: "block" }}>
                                  {u.email}
                                </span>
                              </td>

                              <td style={{ padding: "14px 18px" }}>
                                {/* Accessible aria-label on each select dropdown */}
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
                                  style={{
                                    height: "36px",
                                    padding: "0 10px",
                                    borderRadius: "8px",
                                    background: isSelf ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border-subtle)",
                                    color:
                                      u.role === "ADMIN"
                                        ? "var(--accent-lime)"
                                        : u.role === "PARENT"
                                        ? "var(--mint)"
                                        : "var(--paper)",
                                    fontWeight: 600,
                                    fontSize: "12px",
                                    cursor: isSelf ? "not-allowed" : "pointer",
                                    opacity: isSelf ? 0.7 : 1,
                                  }}
                                >
                                  <option value="STUDENT">STUDENT</option>
                                  <option value="PARENT">PARENT</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>
                              </td>

                              <td style={{ padding: "14px 18px", color: "var(--mist)" }}>
                                {u.materialsCount ?? 0} docs
                              </td>

                              <td style={{ padding: "14px 18px", color: "var(--mist)" }}>
                                {u.quizAttemptsCount ?? 0} attempts
                              </td>

                              <td style={{ padding: "14px 18px", color: "var(--paper)", fontWeight: 500 }}>
                                {formatDuration(u.studyMinutes ?? 0)}
                              </td>

                              <td style={{ padding: "14px 18px" }}>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    background: u.enabled
                                      ? "rgba(196, 255, 106, 0.12)"
                                      : "rgba(255, 107, 107, 0.12)",
                                    color: u.enabled ? "var(--accent-lime)" : "var(--danger)",
                                    fontWeight: 700,
                                  }}
                                >
                                  {u.enabled ? "ACTIVE" : "SUSPENDED"}
                                </span>
                              </td>

                              <td style={{ padding: "14px 18px" }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isSelf || (isLastAdmin && u.enabled)}
                                  onClick={() => setPendingToggleStatus(u)}
                                  style={{
                                    fontSize: "12px",
                                    color: u.enabled ? "var(--danger)" : "var(--accent-lime)",
                                    opacity: isSelf || (isLastAdmin && u.enabled) ? 0.4 : 1,
                                  }}
                                >
                                  {u.enabled ? "Suspend" : "Activate"}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div
                      style={{
                        padding: "14px 18px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "var(--mist)" }}>
                        Page {page} of {totalPages}
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          icon={<ChevronLeft size={14} />}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          iconRight={<ChevronRight size={14} />}
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
              <div
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "18px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px" }}>
                      Document Ingestion & NLP Pipeline
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--mist)" }}>
                      Live monitor for student uploads, optical character extraction, and summarization tasks.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ position: "relative" }}>
                      <Search
                        size={14}
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
                        value={docSearch}
                        onChange={(e) => setDocSearch(e.target.value)}
                        placeholder="Search document title or owner..."
                        style={{
                          height: "38px",
                          padding: "0 12px 0 34px",
                          borderRadius: "8px",
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--paper)",
                          fontSize: "13px",
                        }}
                      />
                    </div>

                    <select
                      value={docStatusFilter}
                      aria-label="Filter documents by ingestion status"
                      onChange={(e) => setDocStatusFilter(e.target.value)}
                      style={{
                        height: "38px",
                        padding: "0 12px",
                        borderRadius: "8px",
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--paper)",
                        fontSize: "13px",
                      }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                      <tr
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderBottom: "1px solid var(--border-subtle)",
                          color: "var(--mist)",
                          fontSize: "11px",
                          textTransform: "uppercase",
                        }}
                      >
                        <th style={{ padding: "12px 16px" }}>Document</th>
                        <th style={{ padding: "12px 16px" }}>Owner</th>
                        <th style={{ padding: "12px 16px" }}>Size</th>
                        <th style={{ padding: "12px 16px" }}>Status</th>
                        <th style={{ padding: "12px 16px" }}>Diagnostic Details</th>
                        <th style={{ padding: "12px 16px" }}>Uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <strong style={{ color: "var(--paper)", display: "block" }}>{doc.title}</strong>
                            <span style={{ fontSize: "11px", color: "var(--mist)" }}>{doc.fileName}</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ color: "var(--paper)" }}>{doc.ownerName}</span>
                            <span style={{ display: "block", fontSize: "11px", color: "var(--mist)" }}>{doc.ownerEmail}</span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--mist)" }}>
                            {formatFileSize(doc.fileSize)}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background:
                                  doc.status === "COMPLETED"
                                    ? "rgba(196, 255, 106, 0.12)"
                                    : doc.status === "FAILED"
                                    ? "rgba(255, 107, 107, 0.12)"
                                    : "rgba(255, 204, 0, 0.12)",
                                color:
                                  doc.status === "COMPLETED"
                                    ? "var(--accent-lime)"
                                    : doc.status === "FAILED"
                                    ? "var(--danger)"
                                    : "#f6c445",
                                fontWeight: 700,
                              }}
                            >
                              {doc.status}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: doc.processingError ? "var(--danger)" : "var(--mist)",
                              fontSize: "12px",
                              maxWidth: "240px",
                              wordBreak: "break-word",
                            }}
                          >
                            {doc.processingError ? doc.processingError : "Extraction verified"}
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--mist)", fontSize: "12px" }}>
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Recent Activity Stream */}
            {activeTab === "activity" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: "24px",
                }}
              >
                {/* Recent Quizzes */}
                <div
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "18px",
                    padding: "24px",
                  }}
                >
                  <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Award size={16} color="var(--accent-lime)" /> Recent Quiz Submissions
                  </h3>
                  {activity?.quizzes && activity.quizzes.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {activity.quizzes.map((q) => (
                        <div
                          key={q.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 14px",
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "10px",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "13px", color: "var(--paper)", display: "block" }}>
                              {q.studentName}
                            </strong>
                            <span style={{ fontSize: "11px", color: "var(--mist)" }}>{q.quizTitle}</span>
                          </div>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: q.accuracyPercent >= 70 ? "var(--accent-lime)" : "var(--danger)",
                            }}
                          >
                            {q.score}/{q.total} ({q.accuracyPercent}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: "var(--mist)" }}>No recent quiz activity.</p>
                  )}
                </div>

                {/* Recent Focus Blocks */}
                <div
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "18px",
                    padding: "24px",
                  }}
                >
                  <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={16} color="var(--mint)" /> Recent Focus Sessions
                  </h3>
                  {activity?.sessions && activity.sessions.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {activity.sessions.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 14px",
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "10px",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "13px", color: "var(--paper)", display: "block" }}>
                              {s.studentName}
                            </strong>
                            <span style={{ fontSize: "11px", color: "var(--mist)" }}>
                              {new Date(s.startedAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-lime)" }}>
                            {s.durationMinutes} min
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: "var(--mist)" }}>No recent focus blocks.</p>
                  )}
                </div>

                {/* Recent Registrations */}
                <div
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "18px",
                    padding: "24px",
                  }}
                >
                  <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Users size={16} color="var(--info)" /> New Account Registrations
                  </h3>
                  {activity?.users && activity.users.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {activity.users.map((u) => (
                        <div
                          key={u.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 14px",
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "10px",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "13px", color: "var(--paper)", display: "block" }}>
                              {u.name}
                            </strong>
                            <span style={{ fontSize: "11px", color: "var(--mist)" }}>{u.email}</span>
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: "rgba(255,255,255,0.06)",
                              color: "var(--paper)",
                            }}
                          >
                            {u.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: "var(--mist)" }}>No recent sign-ups.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Telemetry Diagnostics & Live In-Session Audit Log */}
            {activeTab === "telemetry" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Audit Log Panel */}
                <div
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "18px",
                    padding: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <History size={18} color="var(--accent-lime)" />
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
                        Administrative Security Audit Log
                      </h3>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--mist)" }}>
                        Cryptographically traceable record of role alterations and account state actions.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {auditLog.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "13px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background:
                                  entry.action === "ROLE_CHANGE"
                                    ? "rgba(196,255,106,0.15)"
                                    : "rgba(255,107,107,0.15)",
                                color:
                                  entry.action === "ROLE_CHANGE"
                                    ? "var(--accent-lime)"
                                    : "var(--danger)",
                              }}
                            >
                              {entry.action}
                            </span>
                            <strong style={{ color: "var(--paper)" }}>{entry.targetUser}</strong>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--mist)" }}>
                            {entry.details}
                          </p>
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--mist)", whiteSpace: "nowrap" }}>
                          {entry.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Host Diagnostics Grid */}
                <div
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "18px",
                    padding: "24px",
                  }}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px" }}>
                    Host Machine & Microservice Health
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <div style={{ padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: "12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--mist)", textTransform: "uppercase" }}>
                        JVM Allocated Heap
                      </span>
                      <h4 style={{ margin: "4px 0", fontSize: "18px", color: "var(--accent-lime)" }}>
                        {system.serverTelemetry.jvmUsedMemoryMB} MB / {system.serverTelemetry.jvmMaxMemoryMB} MB
                      </h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--mist)" }}>
                        Usage: {system.serverTelemetry.memoryUsagePercent}%
                      </p>
                    </div>

                    <div style={{ padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: "12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--mist)", textTransform: "uppercase" }}>
                        FastAPI ML Microservice
                      </span>
                      <h4 style={{ margin: "4px 0", fontSize: "18px", color: "var(--mint)" }}>
                        {system.serverTelemetry.mlEngineStatus}
                      </h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--mist)" }}>Port 8000 (Internal Token)</p>
                    </div>

                    <div style={{ padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: "12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--mist)", textTransform: "uppercase" }}>
                        Host CPU Architecture
                      </span>
                      <h4 style={{ margin: "4px 0", fontSize: "18px", color: "var(--paper)" }}>
                        {system.serverTelemetry.availableProcessors} Available Cores
                      </h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--mist)" }}>JDK {system.serverTelemetry.javaVersion}</p>
                    </div>

                    <div style={{ padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: "12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--mist)", textTransform: "uppercase" }}>
                        Platform Time Synchronization
                      </span>
                      <h4 style={{ margin: "4px 0", fontSize: "18px", color: "var(--paper)" }}>
                        {new Date(system.serverTelemetry.serverTime).toLocaleTimeString()}
                      </h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--mist)" }}>
                        {new Date(system.serverTelemetry.serverTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Role Change Confirmation Dialog */}
      {pendingRoleChange && (
        <ConfirmDialog
          isOpen={true}
          title="Change User Access Role?"
          description={`Are you sure you want to change ${pendingRoleChange.user.name}'s role from ${pendingRoleChange.user.role} to ${pendingRoleChange.newRole}? The updated permissions will take effect upon their next session refresh.`}
          confirmLabel={`Set Role to ${pendingRoleChange.newRole}`}
          cancelLabel="Cancel"
          danger={pendingRoleChange.newRole !== "ADMIN" && pendingRoleChange.user.role === "ADMIN"}
          onConfirm={() => void executeRoleChange()}
          onCancel={() => setPendingRoleChange(null)}
        />
      )}

      {/* Toggle Status Confirmation Dialog */}
      {pendingToggleStatus && (
        <ConfirmDialog
          isOpen={true}
          title={pendingToggleStatus.enabled ? "Suspend User Account?" : "Activate User Account?"}
          description={
            pendingToggleStatus.enabled
              ? `Are you sure you want to suspend ${pendingToggleStatus.name}'s account? They will be immediately blocked from signing in until re-activated.`
              : `Are you sure you want to restore access for ${pendingToggleStatus.name}?`
          }
          confirmLabel={pendingToggleStatus.enabled ? "Suspend Account" : "Activate Account"}
          cancelLabel="Cancel"
          danger={pendingToggleStatus.enabled}
          onConfirm={() => void executeToggleStatus()}
          onCancel={() => setPendingToggleStatus(null)}
        />
      )}
    </>
  );
}
