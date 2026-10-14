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
function formatBadge(n: number): string {
  if (n > 99) return "99+";
  return String(n);
}

// =====================================================
// SIDEBAR
// =====================================================
export function Sidebar() {
  const currentView = useYudit((s) => s.currentView);
  const setView = useYudit((s) => s.setView);
  const sidebarOpen = useYudit((s) => s.sidebarOpen);
  const setSidebarOpen = useYudit((s) => s.setSidebarOpen);
  const pool = useYudit((s) => s.pool);
  const user = useYudit((s) => s.user);
  const files = useYudit((s) => s.files);
  const drives = useYudit((s) => s.drives);
  const showConfirm = useYudit((s) => s.showConfirm);
  const logout = useYudit((s) => s.logout);

  const pct = pool.total > 0 ? Math.round((pool.used / pool.total) * 100) : 0;

  const handleLogout = () => {
    showConfirm("Logout?", "Kamu akan keluar dari akun ini.", logout);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "y-glass fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col gap-6 border-r border-[var(--y-border)] p-5 transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* ============================================
            BRAND
            ============================================ */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="y-gradient-brand y-glow-primary grid h-9 w-9 place-items-center rounded-xl">
            <Cloud size={20} className="text-white" fill="currentColor" />
          </div>
          <div className="text-[18px] font-bold tracking-tight text-[var(--y-text)]">
            Yudit<span className="y-gradient-text">Cloud</span>
          </div>
        </div>

        {/* ============================================
            NAV
            ============================================ */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--y-text-mute)]">
            Menu
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = currentView === item.key;
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
                          ? "bg-[rgba(99,102,241,0.25)] text-[var(--y-text)]"
                          : "bg-[var(--y-bg-hover)] text-[var(--y-text-dim)]",
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
            </div>
            <div className="truncate text-[11px] text-[var(--y-text-mute)]">
              {user?.email || "—"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--y-text-mute)] transition-colors hover:bg-[rgba(239,68,68,0.12)] hover:text-[var(--y-danger)]"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* ============================================
            MOBILE CLOSE
            ============================================ */}
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

// =====================================================
// HELPERS
// =====================================================
function countMonthlyFolders(
  files: { folder_name: string | null }[],
): number {
  const set = new Set<string>();
  files.forEach((f) => set.add(f.folder_name || "Tanpa Folder"));
  return set.size;
}