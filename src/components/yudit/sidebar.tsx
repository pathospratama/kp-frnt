"use client";

import {
  Archive,
  LayoutDashboard,
  Files,
  UploadCloud,
  Activity,
  HardDrive,
  UserRound,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import type { RoleKey, ViewKey } from "@/lib/yudit/types";
import { formatBytes } from "@/lib/yudit/utils";
import { cn } from "@/lib/utils";

const PEGAWAI_NAV: { key: ViewKey; label: string; icon: typeof Archive }[] = [
  { key: "arsip", label: "Arsip", icon: Archive },
  { key: "profil", label: "Profil", icon: UserRound },
];

const ADMIN_NAV: { key: ViewKey; label: string; icon: typeof Archive }[] = [
  { key: "ringkasan", label: "Ringkasan", icon: LayoutDashboard },
  { key: "arsip", label: "Semua Arsip", icon: Files },
  { key: "unggah", label: "Unggah Dokumen", icon: UploadCloud },
  { key: "aktivitas", label: "Aktivitas", icon: Activity },
  { key: "penyimpanan", label: "Penyimpanan", icon: HardDrive },
  { key: "profil", label: "Profil", icon: UserRound },
];

function formatBadge(n: number): string {
  if (n > 99) return "99+";
  return String(n);
}

export function Sidebar() {
  const currentView = useYudit((s) => s.currentView);
  const setView = useYudit((s) => s.setView);
  const sidebarOpen = useYudit((s) => s.sidebarOpen);
  const setSidebarOpen = useYudit((s) => s.setSidebarOpen);
  const role = useYudit((s) => s.role);
  const setRole = useYudit((s) => s.setRole);
  const pool = useYudit((s) => s.pool);
  const user = useYudit((s) => s.user);
  const files = useYudit((s) => s.files);
  const showConfirm = useYudit((s) => s.showConfirm);
  const logout = useYudit((s) => s.logout);

  const nav = role === "admin" ? ADMIN_NAV : PEGAWAI_NAV;
  const pct = pool.total > 0 ? Math.round((pool.used / pool.total) * 100) : 0;

  const handleLogout = () => {
    showConfirm("Keluar aplikasi?", "Kamu akan keluar dari akun ini.", logout);
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-[var(--y-border)] bg-[#f5f1e8] transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--y-primary)]">
            <Archive size={19} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold tracking-tight text-[var(--y-text)]">
              Arsip Digital
            </div>
            <div className="truncate text-[11px] text-[var(--y-text-dim)]">
              Persidangan · DPRD Kuningan
            </div>
          </div>
        </div>

        {/* Role switch (level tampilan; hak akses final di backend) */}
        <div className="px-4 pb-3">
          <div
            className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-1"
            role="group"
            aria-label="Mode tampilan"
          >
            {(["pegawai", "admin"] as RoleKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={cn(
                  "y-focus inline-flex h-8 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium capitalize",
                  role === r
                    ? "bg-[var(--y-primary)] text-white"
                    : "text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]",
                )}
              >
                {r === "pegawai" ? <User size={14} /> : <ShieldCheck size={14} />}
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Nav */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          <nav className="flex flex-col gap-0.5" aria-label="Navigasi utama">
            {nav.map((item) => {
              const active = currentView === item.key;
              const badge = item.key === "arsip" ? files.length : null;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "y-focus flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active
                      ? "y-nav-active"
                      : "text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
                  )}
                >
                  <item.icon size={17} className="shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge !== null && badge > 0 && (
                    <span className="tnum rounded-full bg-[var(--y-bg-hover)] px-2 py-0.5 text-[11px] font-semibold text-[var(--y-text-dim)]">
                      {formatBadge(badge)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Storage ringkas (admin saja) */}
        {role === "admin" && (
          <div className="mx-3 mb-3 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--y-text-dim)]">Penyimpanan</span>
              <span className="tnum text-xs font-bold text-[var(--y-primary)]">{pct}%</span>
            </div>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--y-bg-hover)]">
              <div className="h-full rounded-full bg-[var(--y-primary)]" style={{ width: `${pct}%` }} />
            </div>
            <div className="tnum flex items-center justify-between text-[11px] text-[var(--y-text-mute)]">
              <span>{formatBytes(pool.used)} / {formatBytes(pool.total)}</span>
              <span>{pool.accounts} akun</span>
            </div>
          </div>
        )}

        {/* User chip */}
        <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--y-primary)] text-[13px] font-bold text-white">
            {(user?.username || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[var(--y-text)]">
              {user?.username || "Pengguna"}
            </div>
            <div className="truncate text-[11px] text-[var(--y-text-mute)]">{user?.email || "—"}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            aria-label="Keluar aplikasi"
            className="y-focus grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--y-text-mute)] hover:bg-red-50 hover:text-[var(--y-danger)]"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
