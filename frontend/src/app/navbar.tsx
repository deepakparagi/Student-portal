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
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

type UserData = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

const STUDENT_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ai-tutor", label: "AI Tutor", icon: Sparkles },
  { href: "/quizzes", label: "Quizzes", icon: Award },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/focus", label: "Focus", icon: Clock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
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
  const [mobileDrawerPath, setMobileDrawerPath] = useState<string | null>(null);
  const [userMenuPath, setUserMenuPath] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileDrawerOpen = mobileDrawerPath === pathname;
  const userMenuOpen = userMenuPath === pathname;

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
        setUserMenuPath(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <header className="sticky top-0 z-40 w-full border-b border-[#243556] bg-[#0D1731]/95 backdrop-blur-md h-14" role="banner">
        <div className="app-container flex items-center justify-between h-full">
          {/* Brand Logo */}
          <Link
            className="flex items-center text-decoration-none shrink-0 group"
            href={role === "ADMIN" ? "/admin" : role === "PARENT" ? "/parent" : "/dashboard"}
            aria-label="Smart Study Portal Home"
          >
            <Logo size={28} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              const isAi = item.href === "/ai-tutor";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#1A2A4B] text-[#7185FF] font-semibold border border-[#243556] shadow-sm"
                      : "text-[#C4CEE4] hover:text-[#F4F7FF] hover:bg-[#1A2A4B]/60"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    size={14}
                    className={
                      isAi
                        ? "text-[#55D6E8]"
                        : isActive
                        ? "text-[#7185FF]"
                        : "text-[#8998B7]"
                    }
                  />
                  <span>{item.label}</span>
                  {isAi && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#55D6E8] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Custom action + User Profile Dropdown + Mobile Hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            {customRightAction}

            {/* Profile Dropdown */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuPath(userMenuOpen ? null : pathname)}
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#111E3B] border border-[#243556] hover:border-[#32476E] text-[#F4F7FF] text-[13px] transition-colors cursor-pointer"
              >
                <span
                  className={`grid w-6 h-6 place-items-center rounded-full text-[11px] font-semibold ${
                    role === "ADMIN"
                      ? "bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30"
                      : role === "PARENT"
                      ? "bg-[#7185FF]/20 text-[#7185FF] border border-[#7185FF]/30"
                      : "bg-[#4ADEA6]/20 text-[#4ADEA6] border border-[#4ADEA6]/30"
                  }`}
                >
                  {userInitial}
                </span>
                <span className="hidden sm:inline font-medium max-w-[120px] truncate text-[#F4F7FF]">
                  {user?.name || "Account"}
                </span>
                <ChevronDown size={13} className="text-[#8998B7]" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-56 rounded-lg bg-[#111E3B] border border-[#243556] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-2 border-b border-[#243556] mb-1">
                    <div className="text-[13px] font-semibold text-[#F4F7FF] truncate">
                      {user?.name || "Logged In"}
                    </div>
                    <div className="text-[11px] text-[#C4CEE4] truncate mt-0.5">
                      {user?.email || (role === "ADMIN" ? "admin@test.com" : role === "PARENT" ? "parent@test.com" : "student@test.com")}
                    </div>
                    <div className="mt-1.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                        role === "ADMIN"
                          ? "bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30"
                          : role === "PARENT"
                          ? "bg-[#7185FF]/15 text-[#7185FF] border border-[#7185FF]/30"
                          : "bg-[#4ADEA6]/15 text-[#4ADEA6] border border-[#4ADEA6]/30"
                      }`}>
                        {role}
                      </span>
                    </div>
                  </div>

                  {role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-[#C4CEE4] hover:text-[#F4F7FF] hover:bg-[#1A2A4B] rounded-md transition-colors"
                      onClick={() => setUserMenuPath(null)}
                    >
                      <ShieldAlert size={14} className="text-[#FB7185]" /> Admin Console
                    </Link>
                  )}

                  {role === "PARENT" && (
                    <Link
                      href="/parent"
                      className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-[#C4CEE4] hover:text-[#F4F7FF] hover:bg-[#1A2A4B] rounded-md transition-colors"
                      onClick={() => setUserMenuPath(null)}
                    >
                      <ShieldCheck size={14} className="text-[#7185FF]" /> Parent Portal
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-[#C4CEE4] hover:text-[#F4F7FF] hover:bg-[#1A2A4B] rounded-md transition-colors"
                    onClick={() => setUserMenuPath(null)}
                  >
                    <LayoutDashboard size={14} className="text-[#8998B7]" /> Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 mt-1 text-[13px] text-[#FB7185] hover:text-[#FDA4AF] hover:bg-[#FB7185]/10 rounded-md transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button (< 1024px) */}
            <button
              type="button"
              className="p-1.5 rounded-md text-[#C4CEE4] hover:text-[#F4F7FF] hover:bg-[#1A2A4B] lg:hidden cursor-pointer"
              onClick={() => setMobileDrawerPath(mobileDrawerOpen ? null : pathname)}
              aria-expanded={mobileDrawerOpen}
              aria-label="Toggle navigation drawer"
            >
              {mobileDrawerOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-x-0 top-14 bottom-0 bg-[#0D1731]/98 backdrop-blur-xl p-4 z-50 flex flex-col gap-1 border-t border-[#243556] overflow-y-auto lg:hidden animate-in fade-in duration-150">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8998B7] px-3 py-1 mb-1">
              Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              const isAi = item.href === "/ai-tutor";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileDrawerPath(null)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-[14px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#1A2A4B] text-[#7185FF] font-semibold border border-[#243556]"
                      : "text-[#C4CEE4] hover:bg-[#1A2A4B]/60 hover:text-[#F4F7FF]"
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      isAi
                        ? "text-[#55D6E8]"
                        : isActive
                        ? "text-[#7185FF]"
                        : "text-[#8998B7]"
                    }
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="mt-auto pt-4 border-t border-[#243556]">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 p-2.5 text-[14px] font-medium text-[#FB7185] hover:bg-[#FB7185]/10 rounded-md transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Bar (< 1024px) */}
      <nav className="mobile-bottom-bar bg-[#0D1731] border-t border-[#243556]" aria-label="Mobile Bottom Bar Navigation">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const isAi = item.href === "/ai-tutor";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? "text-[#7185FF] font-semibold" : "text-[#8998B7] hover:text-[#C4CEE4]"}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={18}
                className={
                  isAi
                    ? "text-[#55D6E8]"
                    : isActive
                    ? "text-[#7185FF]"
                    : "text-[#8998B7]"
                }
              />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileDrawerPath(mobileDrawerOpen ? null : pathname)}
          className="mobile-nav-item text-[#8998B7] hover:text-[#C4CEE4]"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
          aria-label="More options"
        >
          <Menu size={18} />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
}
