"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Award,
  Sparkles,
  ListTodo,
  Clock,
  BarChart3,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

type UserData = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

const STUDENT_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quizzes", label: "Quizzes", icon: Award },
  { href: "/ai-tutor", label: "AI Tutor", icon: Sparkles },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/focus", label: "Focus Mode", icon: Clock },
  { href: "/analytics", label: "Progress", icon: BarChart3 },
];

const PARENT_NAV = [
  { href: "/parent", label: "Parent Portal", icon: ShieldCheck },
  { href: "/dashboard", label: "Student View", icon: LayoutDashboard },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Administration", icon: ShieldAlert },
  { href: "/dashboard", label: "Student Preview", icon: LayoutDashboard },
];

export function Navbar({ customRightAction }: { customRightAction?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) setUser(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const role = user?.role ?? (pathname.startsWith("/admin") ? "ADMIN" : pathname.startsWith("/parent") ? "PARENT" : "STUDENT");
  const navItems = role === "ADMIN" ? ADMIN_NAV : role === "PARENT" ? PARENT_NAV : STUDENT_NAV;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    } finally {
      router.push("/login");
    }
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : role.charAt(0);

  return (
    <>
      <header className="global-navbar" role="banner">
        <div className="app-container global-navbar-inner">
          {/* Brand Logo & Tag */}
          <Link
            className="brand"
            href={role === "ADMIN" ? "/admin" : role === "PARENT" ? "/parent" : "/dashboard"}
            aria-label="Smart Study Portal Home"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                display: "grid",
                width: "32px",
                height: "32px",
                placeItems: "center",
                borderRadius: "8px",
                background: "var(--accent-lime)",
                color: "#051409",
                fontFamily: "var(--font-serif-family)",
                fontSize: "18px",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(122, 255, 135, 0.35)",
              }}
            >
              S
            </span>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--paper)" }}>
              smart study
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links-desktop" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item-link ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={15} color={isActive ? "var(--accent-lime)" : "currentColor"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Custom action + User Profile Dropdown + Mobile Hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {customRightAction}

            {/* Profile Dropdown */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "5px 10px 5px 6px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--line)",
                  cursor: "pointer",
                  color: "var(--paper)",
                  minHeight: "40px",
                }}
              >
                <span
                  style={{
                    display: "grid",
                    width: "28px",
                    height: "28px",
                    placeItems: "center",
                    borderRadius: "6px",
                    background: role === "ADMIN" ? "rgba(239, 68, 68, 0.2)" : role === "PARENT" ? "rgba(59, 130, 246, 0.2)" : "rgba(34, 197, 94, 0.2)",
                    color: role === "ADMIN" ? "#fca5a5" : role === "PARENT" ? "#93c5fd" : "#86efac",
                    border: "1px solid currentColor",
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                >
                  {userInitial}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="hidden sm:inline">
                  {user?.name || "My Account"}
                </span>
                <ChevronDown size={14} color="var(--mist)" />
              </button>

              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: "240px",
                    background: "rgba(10, 20, 14, 0.96)",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(20px)",
                    padding: "12px",
                    zIndex: 200,
                  }}
                >
                  <div style={{ paddingBottom: "10px", marginBottom: "10px", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--paper)" }}>
                      {user?.name || "Active Session"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--mist)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user?.email || (role === "ADMIN" ? "admin@test.com" : role === "PARENT" ? "parent@test.com" : "student@test.com")}
                    </div>
                    <div style={{ marginTop: "6px" }}>
                      <span className={`badge ${role === "ADMIN" ? "badge-danger" : role === "PARENT" ? "badge-info" : "badge-success"}`}>
                        {role}
                      </span>
                    </div>
                  </div>

                  {role === "ADMIN" && (
                    <Link
                      href="/admin"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        fontSize: "13px",
                        color: "var(--paper)",
                        borderRadius: "6px",
                      }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <ShieldAlert size={14} color="#fca5a5" /> Admin Console
                    </Link>
                  )}

                  {role === "PARENT" && (
                    <Link
                      href="/parent"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        fontSize: "13px",
                        color: "var(--paper)",
                        borderRadius: "6px",
                      }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <ShieldCheck size={14} color="#93c5fd" /> Parent Portal
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      fontSize: "13px",
                      color: "var(--paper)",
                      borderRadius: "6px",
                    }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <LayoutDashboard size={14} color="var(--mint)" /> Student Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      marginTop: "4px",
                      fontSize: "13px",
                      color: "#fca5a5",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <LogOut size={14} />
                    <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Drawer Button (< 1024px) */}
            <button
              type="button"
              className="btn-icon lg:hidden"
              onClick={() => setMobileDrawerOpen((o) => !o)}
              aria-expanded={mobileDrawerOpen}
              aria-label="Toggle navigation drawer"
            >
              {mobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileDrawerOpen && (
          <div
            style={{
              position: "fixed",
              top: "var(--nav-height)",
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(5, 12, 8, 0.96)",
              backdropFilter: "blur(24px)",
              padding: "20px",
              zIndex: 99,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              overflowY: "auto",
            }}
          >
            <p className="eyebrow" style={{ marginBottom: "12px" }}>
              Navigation Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--accent-lime)" : "var(--paper)",
                    background: isActive ? "var(--accent-lime-dim)" : "rgba(255, 255, 255, 0.03)",
                    border: isActive ? "1px solid var(--accent-lime-border)" : "1px solid var(--line)",
                    minHeight: "48px",
                  }}
                >
                  <Icon size={18} color={isActive ? "var(--accent-lime)" : "var(--mint)"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div style={{ marginTop: "auto", paddingTop: "20px" }}>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="button danger"
                style={{ width: "100%", minHeight: "48px" }}
              >
                <LogOut size={16} />
                <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Bar for Rapid Role Switching (< 1024px) */}
      <nav className="mobile-bottom-bar" aria-label="Mobile Bottom Bar Navigation">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? "is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} color={isActive ? "var(--accent-lime)" : "var(--mist)"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen((o) => !o)}
          className="mobile-nav-item"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
          aria-label="More options"
        >
          <Menu size={18} color={mobileDrawerOpen ? "var(--accent-lime)" : "var(--mist)"} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
