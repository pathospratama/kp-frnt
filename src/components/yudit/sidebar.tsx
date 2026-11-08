"use client";

import { motion } from "framer-motion";
import {
  Cloud,
  FolderOpen,
  CalendarDays,
  BarChart3,
  HardDrive,
  LogOut,
  ChevronLeft,
  FileCog,
  Users,
  ClipboardCheck,
  User as UserIcon,
} from "lucide-react";
import { useYudit, canManageWorkspace } from "@/lib/yudit/store";
import type { ViewKey, UserRole } from "@/lib/yudit/types";
import { formatBytes } from "@/lib/yudit/utils";
import { cn } from "@/lib/utils";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: typeof FolderOpen;
}

// =====================================================
// NAV ITEMS — semua role bisa lihat semua menu
// =====================================================
function getNavItems(role: UserRole | undefined): NavItem[] {
  const base: NavItem[] = [
    { key: "files", label: "My Files", icon: FolderOpen },
  ];

  if (role === "member") {
    base.push({
      key: "my-tasks",
      label: "Dokumen Saya",
      icon: ClipboardCheck,
    });
  }

  base.push(
    { key: "convert", label: "Konversi Dokumen", icon: FileCog },
    { key: "monthly", label: "Per Bulan", icon: CalendarDays },
    { key: "stats", label: "Statistik", icon: BarChart3 },
  );

  // Drives & Collaborators tampil untuk SEMUA role
  // (member = read-only, action button disembunyikan di view)
  base.push(
    { key: "drives", label: "Google Drive", icon: HardDrive },
    { key: "collaborators", label: "Collaborators", icon: Users },
  );

  return base;
}

function formatBadge(n: number): string {
  if (n > 99) return "99+";
  return String(n);
}

export function Sidebar() {
  const currentView = useYudit((s) => s.currentView);
  const setView = useYudit((s) => s.setView);
  const sidebarOpen = useYudit((s) => s.sidebarOpen);
  const setSidebarOpen = useYudit((s) => s.setSidebarOpen);
  const pool = useYudit((s) => s.pool);
  const user = useYudit((s) => s.user);
  const files = useYudit((s) => s.files);
  const drives = useYudit((s) => s.drives);
  const conversionJobs = useYudit((s) => s.conversionJobs);
  const collaborators = useYudit((s) => s.collaborators);
  const showConfirm = useYudit((s) => s.showConfirm);
  const logout = useYudit((s) => s.logout);

  const NAV = getNavItems(user?.role);
  const isManager = canManageWorkspace(user);
  const pct = pool.total > 0 ? Math.round((pool.used / pool.total) * 100) : 0;

  const handleLogout = () => {
    showConfirm("Logout?", "Kamu akan keluar dari akun ini.", logout);
  };

  const handleOpenProfile = () => {
    setView("profile");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const convertingCount = conversionJobs.filter(
    (j) => j.status === "processing",
  ).length;

  const activeCategories = new Set(
    files.map((f) => f.category).filter((c): c is string => !!c),
  ).size;

  function getBadge(key: ViewKey): number | null {
    switch (key) {
      case "files":
        return files.length > 0 ? files.length : null;
      case "my-tasks":
        return files.length > 0 ? files.length : null;
      case "monthly":
        return countMonthlyFolders(files) || null;
      case "drives":
        return drives.length > 0 ? drives.length : null;
      case "convert":
        return convertingCount > 0 ? convertingCount : null;
      case "collaborators":
        return collaborators.length > 0 ? collaborators.length : null;
      case "stats":
        return activeCategories > 0 ? activeCategories : null;
      default:
        return null;
    }
  }

  const isProfileActive = currentView === "profile";

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "y-glass fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col gap-6 border-r border-[var(--y-border)] p-5 transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* BRAND */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="y-gradient-brand y-glow-primary grid h-9 w-9 place-items-center rounded-xl">
            <Cloud size={20} className="text-white" fill="currentColor" />
          </div>
          <div className="text-[18px] font-bold tracking-tight text-[var(--y-text)]">
            DPRD<span className="y-gradient-text">Cloud</span>
          </div>
        </div>

        {/* NAV */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--y-text-mute)]">
            Menu
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = currentView === item.key;
              const badge = getBadge(item.key);

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "y-nav-active"
                      : "text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
                  )}
                >
                  <item.icon
                    size={17}
                    className={cn(
                      "shrink-0 transition-colors",
                      active
                        ? "text-[var(--y-primary)]"
                        : "text-[var(--y-text-mute)] group-hover:text-[var(--y-text-dim)]",
                    )}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge !== null && badge > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                        active
                          ? "bg-[rgba(239,68,68,0.15)] text-[var(--y-primary)]"
                          : "bg-[var(--y-bg-elev-2)] text-[var(--y-text-dim)]",
                      )}
                    >
                      {formatBadge(badge)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* STORAGE WIDGET */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-3.5"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--y-text-dim)]">
              Storage Pool
            </span>
            <span className="text-xs font-bold text-[var(--y-primary)] tabular-nums">
              {pct}%
            </span>
          </div>
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--y-bg-elev-2)]">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--y-primary), var(--y-accent))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--y-text-mute)]">
            <span className="tabular-nums">
              {formatBytes(pool.used)} / {formatBytes(pool.total)}
            </span>
            <span className="tabular-nums">
              {pool.accounts} drive{pool.accounts !== 1 ? "s" : ""}
            </span>
          </div>
        </motion.div>

        {/* MEMBER INFO */}
        {!isManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] p-3.5"
          >
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--y-primary)]">
              <ClipboardCheck size={12} />
              Mode Member
            </div>
            <div className="text-[11px] leading-relaxed text-[var(--y-text-dim)]">
              Anda bisa lihat semua dokumen (read-only) & edit dokumen yang
              di-assign owner. File baru masuk ke pool owner.
            </div>
          </motion.div>
        )}

        {/* PROFILE BUTTON */}
        <button
          onClick={handleOpenProfile}
          className={cn(
            "group flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all",
            isProfileActive
              ? "border-[var(--y-primary)] bg-[rgba(239,68,68,0.08)]"
              : "border-[var(--y-border)] bg-[var(--y-bg-elev)] hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)]",
          )}
          title="Buka Profil Saya"
        >
          <div
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white",
              user?.role === "owner"
                ? "y-gradient-brand"
                : user?.role === "super_admin"
                  ? "bg-[#f59e0b]"
                  : "bg-[var(--y-primary)]",
            )}
          >
            {(user?.username || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-[13px] font-semibold text-[var(--y-text)]">
                {user?.username || "User"}
              </span>
              {user?.role === "owner" && (
                <span className="shrink-0 rounded-full bg-[rgba(239,68,68,0.15)] px-1.5 py-0.5 text-[8px] font-bold text-[var(--y-primary)]">
                  OWNER
                </span>
              )}
              {user?.role === "super_admin" && (
                <span className="shrink-0 rounded-full bg-[rgba(245,158,11,0.15)] px-1.5 py-0.5 text-[8px] font-bold text-[#f59e0b]">
                  SUPER
                </span>
              )}
            </div>
            <div className="truncate text-[11px] text-[var(--y-text-mute)]">
              {user?.email || "—"}
            </div>
          </div>
          <UserIcon
            size={15}
            className={cn(
              "shrink-0 transition-colors",
              isProfileActive
                ? "text-[var(--y-primary)]"
                : "text-[var(--y-text-mute)] group-hover:text-[var(--y-text)]",
            )}
          />
        </button>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] text-[12px] font-semibold text-[var(--y-text-dim)] transition-colors hover:border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.08)] hover:text-[var(--y-danger)]"
          title="Logout"
        >
          <LogOut size={14} />
          Logout
        </button>

        {/* MOBILE CLOSE */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute -right-3 top-6 grid h-6 w-6 place-items-center rounded-full border border-[var(--y-border)] bg-[var(--y-bg-elev)] text-[var(--y-text-dim)] lg:hidden"
        >
          <ChevronLeft size={14} />
        </button>
      </aside>
    </>
  );
}

function countMonthlyFolders(files: { folder_name: string | null }[]): number {
  const set = new Set<string>();
  files.forEach((f) => set.add(f.folder_name || "Tanpa Folder"));
  return set.size;
}
