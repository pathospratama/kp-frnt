"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Mail, CheckCircle2, Loader2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { useYudit } from "@/lib/yudit/store";
import { formatBytes, formatDate } from "@/lib/yudit/utils";
import { connectGoogleDrive } from "@/lib/api/oauth";
import { forceRefreshQuota } from "@/lib/api/drives";
import { cn } from "@/lib/utils";

// Batas opsional — None = unlimited
const MAX_DRIVES: number | null = null;


export function DrivesView() {
  const drives = useYudit((s) => s.drives);
  const pool = useYudit((s) => s.pool);
  const removeDrive = useYudit((s) => s.removeDrive);
  const fetchDrives = useYudit((s) => s.fetchDrives);
  const showConfirm = useYudit((s) => s.showConfirm);

  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cek apakah masih boleh connect
  const canConnect =
    MAX_DRIVES === null || drives.length < MAX_DRIVES;

  const handleConnect = async () => {
    if (!canConnect) {
      toast.error(`Maksimal ${MAX_DRIVES} akun Google Drive`);
      return;
    }
    setConnecting(true);
    try {
      const res = await connectGoogleDrive();
      if (res.ok) {
        await fetchDrives();
        toast.success("Akun Google Drive terhubung");
      } else if (res.error === "duplicate_account") {
        toast.error("Akun ini sudah terhubung");
      } else if (res.error === "max_accounts") {
        toast.error("Maksimal akun sudah tercapai");
      } else if (res.error && res.error !== "cancelled") {
        toast.error(`Gagal connect: ${res.error}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal connect";
      toast.error(msg);
    } finally {
      setConnecting(false);
    }
  };

  const handleRefreshQuota = async () => {
    setRefreshing(true);
    try {
      await forceRefreshQuota();
      await fetchDrives();
      toast.success("Quota berhasil di-refresh");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal refresh quota";
      toast.error(msg);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemove = (id: string, email: string) => {
    showConfirm(
      "Hapus akun Drive?",
      `File yang tersimpan di ${email} tidak akan bisa diakses.`,
      async () => {
        try {
          await removeDrive(id);
        } catch {
          // error sudah di-toast
        }
      },
    );
  };

  const pct = pool.total > 0 ? Math.round((pool.used / pool.total) * 100) : 0;

  // Text untuk subtitle
  const accountsText = MAX_DRIVES
    ? `${drives.length} dari ${MAX_DRIVES} akun terhubung`
    : `${drives.length} akun terhubung`;

  return (
    <div className="y-anim-fade">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--y-text)]">
            Google Drive Accounts
          </h1>
          <p className="text-[13px] text-[var(--y-text-dim)]">
            {accountsText} • {formatBytes(pool.used)} dari{" "}
            {formatBytes(pool.total)} terpakai
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshQuota}
            disabled={refreshing}
            title="Refresh quota dari Google"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] font-semibold text-[var(--y-text-dim)] transition-all hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            <span className="hidden sm:inline">Refresh Quota</span>
          </button>
          {canConnect && (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="y-gradient-brand y-glow-primary inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-70"
            >
              {connecting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Hubungkan Drive
            </button>
          )}
        </div>
      </div>

      {/* Pool bar */}
      <div className="mb-5 rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--y-text-dim)]">
            Total Storage Pool • {drives.length} akun
          </span>
          <span className="text-xs font-bold text-[var(--y-accent)] tabular-nums">
            {pct}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--y-bg)]">
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
      </div>

      {/* Drive grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {drives.map((d, i) => {
          const dpct =
            d.quota_total > 0
              ? Math.min(100, Math.round((d.quota_used / d.quota_total) * 100))
              : 0;
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="group relative overflow-hidden rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
            >
              <div
                className="absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(90deg, var(--y-primary), var(--y-accent))",
                }}
              />
              <button
                onClick={() => handleRemove(d.id, d.google_email)}
                title="Hapus"
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-[var(--y-text-mute)] opacity-0 transition-all hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-danger)] group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>

              <div className="mb-3.5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white">
                  <GDriveLogo />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-[var(--y-text)]">
                    {d.google_email}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--y-text-mute)]">
                    <span>Slot #{d.slot_index}</span>
                    {d.is_active && (
                      <span className="inline-flex items-center gap-1 text-[var(--y-success)]">
                        <CheckCircle2 size={11} />
                        aktif
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[var(--y-bg)]">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      dpct > 80
                        ? "linear-gradient(90deg, var(--y-warn), var(--y-danger))"
                        : "linear-gradient(90deg, var(--y-primary), var(--y-accent))",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${dpct}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[var(--y-text-dim)] tabular-nums">
                <span>{formatBytes(d.quota_used)} terpakai</span>
                <span>{formatBytes(d.quota_total)} total</span>
              </div>
            </motion.div>
          );
        })}

        {canConnect && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(drives.length * 0.03, 0.3) }}
            onClick={handleConnect}
            disabled={connecting}
            className={cn(
              "grid min-h-[180px] place-items-center rounded-2xl border-2 border-dashed border-[var(--y-border)] p-6 text-center transition-all",
              "hover:border-[var(--y-primary)] hover:bg-[rgba(99,102,241,0.05)] disabled:opacity-60",
            )}
          >
            <div>
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-[var(--y-border)] bg-[var(--y-bg-elev)] text-[var(--y-primary)] transition-transform group-hover:scale-110">
                {connecting ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <Plus size={22} />
                )}
              </div>
              <div className="text-sm font-semibold text-[var(--y-text)]">
                Hubungkan Google Drive
              </div>
              <div className="mt-1 text-xs text-[var(--y-text-mute)]">
                {MAX_DRIVES
                  ? `Slot ${drives.length + 1} dari ${MAX_DRIVES}`
                  : `Tambah akun (tidak terbatas)`}
              </div>
            </div>
          </motion.button>
        )}
      </div>

      {/* Info card */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--y-border-soft)] bg-[rgba(34,211,238,0.05)] p-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(34,211,238,0.15)]">
          <Mail size={16} className="text-[var(--y-accent)]" />
        </div>
        <div className="text-[13px] leading-relaxed text-[var(--y-text-dim)]">
          <b className="text-[var(--y-text)]">Storage pool tak terbatas.</b>{" "}
          Hubungkan sebanyak mungkin akun Google Drive — Yudit Cloud menggabungkan
          semua kapasitasnya menjadi satu cloud virtual. File baru otomatis
          dialokasikan ke drive dengan ruang tersisa paling efisien.
        </div>
      </div>
    </div>
  );
}

function GDriveLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 87.3 78">
      <path
        d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
        fill="#0066da"
      />
      <path
        d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
        fill="#00ac47"
      />
      <path
        d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
        fill="#ea4335"
      />
      <path
        d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
        fill="#00832d"
      />
      <path
        d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
        fill="#2684fc"
      />
      <path
        d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
        fill="#ffba00"
      />
    </svg>
  );
}