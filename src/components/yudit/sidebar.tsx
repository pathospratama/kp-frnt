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
<<<<<<< HEAD
  FileCog,
  Users,
  ClipboardCheck,
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

  if (role === "owner" || role === "super_admin") {
    base.push(
      { key: "drives", label: "Google Drive", icon: HardDrive },
      { key: "collaborators", label: "Collaborators", icon: Users },
    );
  }

  return base;
}

=======
} from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import type { ViewKey } from "@/lib/yudit/types";
import { formatBytes } from "@/lib/yudit/utils";
import { cn } from "@/lib/utils";

// =====================================================
// NAV ITEMS
// =====================================================
const NAV: { key: ViewKey; label: string; icon: typeof FolderOpen }[] = [
  { key: "files", label: "My Files", icon: FolderOpen },
  { key: "monthly", label: "Per Bulan", icon: CalendarDays },
  { key: "stats", label: "Statistik", icon: BarChart3 },
  { key: "drives", label: "Google Drive", icon: HardDrive },
];

// =====================================================
// HELPER: FORMAT BADGE
// =====================================================
/**
 * Format angka badge — kalau > 99, tampilkan "99+".
 * Biar tidak overflow di sidebar.
 */
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
function formatBadge(n: number): string {
  if (n > 99) return "99+";
  return String(n);
}

<<<<<<< HEAD
=======
// =====================================================
// SIDEBAR
// =====================================================
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
export function Sidebar() {
  const currentView = useYudit((s) => s.currentView);
  const setView = useYudit((s) => s.setView);
  const sidebarOpen = useYudit((s) => s.sidebarOpen);
  const setSidebarOpen = useYudit((s) => s.setSidebarOpen);
  const pool = useYudit((s) => s.pool);
  const user = useYudit((s) => s.user);
  const files = useYudit((s) => s.files);
  const drives = useYudit((s) => s.drives);
<<<<<<< HEAD
  const conversionJobs = useYudit((s) => s.conversionJobs);
  const collaborators = useYudit((s) => s.collaborators);
  const showConfirm = useYudit((s) => s.showConfirm);
  const logout = useYudit((s) => s.logout);

  const NAV = getNavItems(user?.role);
  const isManager = canManageWorkspace(user);
=======
  const showConfirm = useYudit((s) => s.showConfirm);
  const logout = useYudit((s) => s.logout);

>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  const pct = pool.total > 0 ? Math.round((pool.used / pool.total) * 100) : 0;

  const handleLogout = () => {
    showConfirm("Logout?", "Kamu akan keluar dari akun ini.", logout);
  };

<<<<<<< HEAD
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
        return isManager && drives.length > 0 ? drives.length : null;
      case "convert":
        return convertingCount > 0 ? convertingCount : null;
      case "collaborators":
        return isManager && collaborators.length > 0 ? collaborators.length : null;
      case "stats":
        return activeCategories > 0 ? activeCategories : null;
      default:
        return null;
    }
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
=======
  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "y-glass fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col gap-6 border-r border-[var(--y-border)] p-5 transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
<<<<<<< HEAD
        {/* BRAND */}
=======
        {/* ============================================
            BRAND
            ============================================ */}
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
        <div className="flex items-center gap-2.5 px-1">
          <div className="y-gradient-brand y-glow-primary grid h-9 w-9 place-items-center rounded-xl">
            <Cloud size={20} className="text-white" fill="currentColor" />
          </div>
          <div className="text-[18px] font-bold tracking-tight text-[var(--y-text)]">
<<<<<<< HEAD
            DPRD<span className="y-gradient-text">Cloud</span>
          </div>
        </div>

        {/* NAV */}
=======
            Yudit<span className="y-gradient-text">Cloud</span>
          </div>
        </div>

        {/* ============================================
            NAV
            ============================================ */}
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--y-text-mute)]">
            Menu
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = currentView === item.key;
<<<<<<< HEAD
              const badge = getBadge(item.key);

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
=======
              const badge =
                item.key === "monthly"
                  ? countMonthlyFolders(files)
                  : item.key === "drives"
                    ? drives.length
                    : null;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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
<<<<<<< HEAD
                          ? "bg-[rgba(239,68,68,0.15)] text-[var(--y-primary)]"
                          : "bg-[var(--y-bg-elev-2)] text-[var(--y-text-dim)]",
=======
                          ? "bg-[rgba(99,102,241,0.25)] text-[var(--y-text)]"
                          : "bg-[var(--y-bg-hover)] text-[var(--y-text-dim)]",
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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

<<<<<<< HEAD
        {/* STORAGE WIDGET */}
        {isManager && (
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
        )}

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
              Anda hanya bisa edit dokumen yang di-assign owner. File baru
              masuk ke pool owner.
            </div>
          </motion.div>
        )}

        {/* USER CHIP */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-2.5">
          <div
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white",
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
=======
        {/* ============================================
            STORAGE WIDGET
            ============================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg)] p-3.5"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--y-text-dim)]">
              Storage Pool
            </span>
            <span className="text-xs font-bold text-[var(--y-accent)] tabular-nums">
              {pct}%
            </span>
          </div>
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--y-bg-hover)]">
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

        {/* ============================================
            USER CHIP
            ============================================ */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg)] p-2.5">
          <div className="y-gradient-brand grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white">
            {(user?.username || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[var(--y-text)]">
              {user?.username || "User"}
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
            </div>
            <div className="truncate text-[11px] text-[var(--y-text-mute)]">
              {user?.email || "—"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
<<<<<<< HEAD
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--y-text-mute)] transition-colors hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--y-danger)]"
=======
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--y-text-mute)] transition-colors hover:bg-[rgba(239,68,68,0.12)] hover:text-[var(--y-danger)]"
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
          >
            <LogOut size={15} />
          </button>
        </div>

<<<<<<< HEAD
        {/* MOBILE CLOSE */}
=======
        {/* ============================================
            MOBILE CLOSE
            ============================================ */}
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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

<<<<<<< HEAD
function countMonthlyFolders(files: { folder_name: string | null }[]): number {
=======
// =====================================================
// HELPERS
// =====================================================
function countMonthlyFolders(
  files: { folder_name: string | null }[],
): number {
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  const set = new Set<string>();
  files.forEach((f) => set.add(f.folder_name || "Tanpa Folder"));
  return set.size;
}