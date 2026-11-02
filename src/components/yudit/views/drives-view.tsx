<<<<<<< HEAD
// src/components/yudit/views/drives-view.tsx
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
<<<<<<< HEAD
  Plus,
  Trash2,
  Mail,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Shield,
  HardDrive,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useYudit, canManageWorkspace } from "@/lib/yudit/store";
import { formatBytes, formatDate } from "@/lib/yudit/utils";
import { connectGoogleDrive } from "@/lib/api/oauth";
import { forceRefreshQuota, disconnectDrive } from "@/lib/api/drives";
import { ApiError } from "@/lib/api/client";
import type { DriveAccount } from "@/lib/yudit/types";
import { cn } from "@/lib/utils";

// Batas opsional — null = unlimited
const MAX_DRIVES: number | null = null;

// =====================================================
// MAIN COMPONENT
// =====================================================
export function DrivesView() {
  const user = useYudit((s) => s.user);
  const drives = useYudit((s) => s.drives);
  const pool = useYudit((s) => s.pool);
  const fetchDrives = useYudit((s) => s.fetchDrives);
  const fetchFiles = useYudit((s) => s.fetchFiles);
=======
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
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  const showConfirm = useYudit((s) => s.showConfirm);

  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
<<<<<<< HEAD
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Guard
  const canManage = canManageWorkspace(user);

  // Cek apakah masih boleh connect
  const canConnect = MAX_DRIVES === null || drives.length < MAX_DRIVES;

  // =====================================================
  // GUARD RENDER
  // =====================================================
  if (!canManage) {
    return (
      <div className="grid place-items-center py-20">
        <div className="max-w-md rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(239,68,68,0.15)]">
            <AlertCircle size={28} className="text-[var(--y-danger)]" />
          </div>
          <h3 className="mb-2 text-base font-semibold text-[var(--y-text)]">
            Akses Ditolak
          </h3>
          <p className="mb-4 text-sm text-[var(--y-text-dim)]">
            Hanya <b>owner</b> atau <b>super admin</b> yang bisa mengelola
            Google Drive. Hubungi owner workspace Anda.
          </p>
          <div className="rounded-lg border border-[var(--y-border-soft)] bg-[rgba(99,102,241,0.05)] p-3 text-left text-[11px] text-[var(--y-text-dim)]">
            <div className="mb-1 font-semibold text-[var(--y-text)]">
              Sebagai member, Anda tetap bisa:
            </div>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Upload file ke pool owner</li>
              <li>Edit dokumen yang di-assign</li>
              <li>Share dokumen yang diizinkan</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // HANDLERS
  // =====================================================
=======

  // Cek apakah masih boleh connect
  const canConnect =
    MAX_DRIVES === null || drives.length < MAX_DRIVES;

>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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
<<<<<<< HEAD
        await fetchFiles();
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
        toast.success("Akun Google Drive terhubung");
      } else if (res.error === "duplicate_account") {
        toast.error("Akun ini sudah terhubung");
      } else if (res.error === "max_accounts") {
        toast.error("Maksimal akun sudah tercapai");
<<<<<<< HEAD
      } else if (res.error === "forbidden") {
        toast.error(
          "Hanya owner atau super admin yang bisa connect Google Drive",
        );
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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
<<<<<<< HEAD
    if (refreshing) return;
    setRefreshing(true);
    const toastId = toast.loading("Refreshing quota semua drive…");
    try {
      await forceRefreshQuota();
      await fetchDrives();
      toast.success("Quota berhasil di-refresh", { id: toastId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal refresh quota";
      toast.error(msg, { id: toastId });
=======
    setRefreshing(true);
    try {
      await forceRefreshQuota();
      await fetchDrives();
      toast.success("Quota berhasil di-refresh");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal refresh quota";
      toast.error(msg);
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
    } finally {
      setRefreshing(false);
    }
  };

<<<<<<< HEAD
  // ⭐ Flow baru: try no-force → kalau 400 → confirm force → soft-delete
  const handleRemove = async (drive: DriveAccount) => {
    if (deletingId) return; // cegah double-click
    setDeletingId(drive.id);

    try {
      // ---- Try 1: tanpa force ----
      // Berhasil kalau drive kosong (hard delete)
      // Gagal 400 kalau ada file (butuh konfirmasi)
      try {
        const res = await disconnectDrive(drive.id, false);
        toast.success(
          res.message || `Akun Drive ${drive.google_email} dihapus`,
        );
        await fetchDrives();
        await fetchFiles();
        return;
      } catch (e: unknown) {
        const err = e as ApiError;
        const detail = err?.detail || err?.message || "";
        const isForceRequired =
          err?.status === 400 &&
          detail.toLowerCase().includes("force");

        // Kalau bukan "force required" → lempar ke error umum
        if (!isForceRequired) {
          throw e;
        }

        // ---- Kasus: masih ada file → konfirmasi force delete ----
        // Detail message dari backend sudah berisi jumlah file,
        // jadi kita tampilkan langsung.
        showConfirm(
          "Drive Masih Berisi File",
          detail,
          async () => {
            try {
              const res2 = await disconnectDrive(drive.id, true);
              toast.success(res2.message || "Akun Drive dihapus");
              await fetchDrives();
              await fetchFiles();
            } catch (err2: unknown) {
              const e2 = err2 as ApiError;
              toast.error(e2?.detail || "Gagal hapus drive");
            } finally {
              setDeletingId(null);
            }
          },
        );
      }
    } catch (e: unknown) {
      const err = e as ApiError;
      toast.error(err?.detail || "Gagal hapus drive");
    } finally {
      // Reset hanya kalau tidak masuk ke confirm flow
      // (kalau masuk, akan di-reset di callback)
      setTimeout(() => {
        setDeletingId((prev) => (prev === drive.id ? null : prev));
      }, 100);
    }
=======
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
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  };

  const pct = pool.total > 0 ? Math.round((pool.used / pool.total) * 100) : 0;

<<<<<<< HEAD
  // Hitung statistik
  const activeDrives = drives.filter((d) => d.is_active).length;
  const inactiveDrives = drives.length - activeDrives;
=======
  // Text untuk subtitle
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  const accountsText = MAX_DRIVES
    ? `${drives.length} dari ${MAX_DRIVES} akun terhubung`
    : `${drives.length} akun terhubung`;

<<<<<<< HEAD
  // =====================================================
  // RENDER
  // =====================================================
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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
<<<<<<< HEAD
            disabled={refreshing || drives.length === 0}
            title="Refresh quota dari Google"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] font-semibold text-[var(--y-text-dim)] transition-all hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] disabled:cursor-not-allowed disabled:opacity-60"
=======
            disabled={refreshing}
            title="Refresh quota dari Google"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] font-semibold text-[var(--y-text-dim)] transition-all hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] disabled:opacity-60"
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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

<<<<<<< HEAD
      {/* Stats summary */}
      {drives.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatChip
            icon={<HardDrive size={14} />}
            label="Total Drive"
            value={String(drives.length)}
            color="#6366f1"
          />
          <StatChip
            icon={<CheckCircle2 size={14} />}
            label="Aktif"
            value={`${activeDrives}${inactiveDrives > 0 ? ` / ${drives.length}` : ""}`}
            color="#10b981"
          />
          <StatChip
            icon={<Users size={14} />}
            label="Storage"
            value={formatBytes(pool.total)}
            color="#22d3ee"
          />
        </div>
      )}

=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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
<<<<<<< HEAD
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--y-text-mute)]">
          <span className="tabular-nums">
            {formatBytes(pool.used)} terpakai
          </span>
          <span className="tabular-nums">
            {formatBytes(pool.free)} tersisa
          </span>
        </div>
      </div>

      {/* Empty state */}
      {drives.length === 0 && !connecting && (
        <div className="mb-5 grid place-items-center rounded-2xl border-2 border-dashed border-[var(--y-border)] py-16 text-center">
          <div className="mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--y-bg-elev)]">
            <HardDrive size={28} className="text-[var(--y-text-mute)]" />
          </div>
          <div className="mb-1 text-base font-semibold text-[var(--y-text)]">
            Belum ada akun Google Drive
          </div>
          <div className="mb-4 max-w-sm text-sm text-[var(--y-text-dim)]">
            Hubungkan akun Google Drive pertama Anda untuk mulai menyimpan
            file di YuditCloud.
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="y-gradient-brand y-glow-primary inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-70"
          >
            {connecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Hubungkan Google Drive
          </button>
        </div>
      )}

      {/* Drive grid */}
      {drives.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {drives.map((d, i) => {
            const dpct =
              d.quota_total > 0
                ? Math.min(
                    100,
                    Math.round((d.quota_used / d.quota_total) * 100),
                  )
                : 0;
            const isDeleting = deletingId === d.id;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-[var(--y-bg-elev)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]",
                  d.is_active
                    ? "border-[var(--y-border)] hover:border-[rgba(99,102,241,0.4)]"
                    : "border-[rgba(239,68,68,0.3)]",
                  isDeleting && "pointer-events-none opacity-60",
                )}
              >
                {/* Top accent bar */}
                <div
                  className="absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    background: d.is_active
                      ? "linear-gradient(90deg, var(--y-primary), var(--y-accent))"
                      : "linear-gradient(90deg, var(--y-danger), var(--y-warn))",
                  }}
                />

                {/* Delete button */}
                <button
                  onClick={() => handleRemove(d)}
                  disabled={isDeleting}
                  title="Hapus drive"
                  className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-[var(--y-text-mute)] opacity-100 transition-all hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-danger)] disabled:cursor-not-allowed sm:opacity-0 sm:group-hover:opacity-100"
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>

                {/* Header: logo + email + slot */}
                <div className="mb-3.5 flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white">
                    <GDriveLogo />
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <div className="truncate text-[13px] font-semibold text-[var(--y-text)]">
                      {d.google_email}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--y-text-mute)]">
                      <span className="rounded bg-[var(--y-bg)] px-1.5 py-0.5 font-semibold">
                        Slot #{d.slot_index}
                      </span>
                      {d.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[var(--y-success)]">
                          <CheckCircle2 size={11} />
                          aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--y-danger)]">
                          <AlertCircle size={11} />
                          token invalid
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Warning kalau inactive */}
                {!d.is_active && (
                  <div className="mb-3 rounded-lg bg-[rgba(239,68,68,0.08)] px-2.5 py-1.5 text-[10.5px] leading-relaxed text-[var(--y-danger)]">
                    ⚠️ Refresh token Google Drive ini sudah revoked. Reconnect
                    akun untuk mengaktifkan kembali.
                  </div>
                )}

                {/* Progress bar */}
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

                {/* Usage info */}
                <div className="flex justify-between text-[11px] text-[var(--y-text-dim)] tabular-nums">
                  <span>{formatBytes(d.quota_used)} terpakai</span>
                  <span>{formatBytes(d.quota_total)} total</span>
                </div>

                {/* Free space */}
                <div className="mt-1 text-[10.5px] text-[var(--y-text-mute)]">
                  {formatBytes(Math.max(0, d.quota_total - d.quota_used))}{" "}
                  bebas • {dpct}% terpakai
                </div>

                {/* Footer: updated time */}
                {d.quota_updated_at && (
  <div className="mt-2 border-t border-[var(--y-border-soft)] pt-2 text-[10px] text-[var(--y-text-mute)]">
    Quota diperbarui {formatDate(d.quota_updated_at)}
  </div>
)}
              </motion.div>
            );
          })}

          {/* Add drive card */}
          {canConnect && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(drives.length * 0.03, 0.3) }}
              onClick={handleConnect}
              disabled={connecting}
              className={cn(
                "group grid min-h-[220px] place-items-center rounded-2xl border-2 border-dashed border-[var(--y-border)] p-6 text-center transition-all",
                "hover:border-[var(--y-primary)] hover:bg-[rgba(99,102,241,0.05)] disabled:cursor-not-allowed disabled:opacity-60",
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
                    : "Tambah akun (tidak terbatas)"}
                </div>
              </div>
            </motion.button>
          )}
        </div>
      )}

      {/* Info card — Tips */}
=======
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
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--y-border-soft)] bg-[rgba(34,211,238,0.05)] p-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(34,211,238,0.15)]">
          <Mail size={16} className="text-[var(--y-accent)]" />
        </div>
        <div className="text-[13px] leading-relaxed text-[var(--y-text-dim)]">
          <b className="text-[var(--y-text)]">Storage pool tak terbatas.</b>{" "}
<<<<<<< HEAD
          Hubungkan sebanyak mungkin akun Google Drive — YuditCloud
          menggabungkan semua kapasitasnya menjadi satu cloud virtual. File
          baru otomatis dialokasikan ke drive dengan ruang tersisa paling
          efisien.
        </div>
      </div>

      {/* Info card — Soft Delete */}
      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[var(--y-border-soft)] bg-[rgba(168,85,247,0.05)] p-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(168,85,247,0.15)]">
          <Trash2 size={16} className="text-[#a855f7]" />
        </div>
        <div className="text-[13px] leading-relaxed text-[var(--y-text-dim)]">
          <b className="text-[var(--y-text)]">Hapus drive yang masih berisi file?</b>{" "}
          Boleh. File metadata akan tetap tersimpan di database (tidak dihapus
          permanen), tapi disembunyikan dari UI. Kalau Anda connect ulang akun
          Google yang <b>sama</b> di kemudian hari, drive akan otomatis
          di-resurrect dan semua file lama muncul kembali.
        </div>
      </div>

      {/* Info card — Security */}
      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[var(--y-border-soft)] bg-[rgba(245,158,11,0.05)] p-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(245,158,11,0.15)]">
          <Shield size={16} className="text-[var(--y-warn)]" />
        </div>
        <div className="text-[13px] leading-relaxed text-[var(--y-text-dim)]">
          <b className="text-[var(--y-text)]">Keamanan token.</b> Access
          token &amp; refresh token dienkripsi dengan Fernet (AES-128 CBC)
          menggunakan SECRET_KEY Anda. Jangan bagikan SECRET_KEY ke siapa pun.
          Kalau perlu ganti SECRET_KEY, semua drive harus di-reconnect.
=======
          Hubungkan sebanyak mungkin akun Google Drive — Yudit Cloud menggabungkan
          semua kapasitasnya menjadi satu cloud virtual. File baru otomatis
          dialokasikan ke drive dengan ruang tersisa paling efisien.
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
        </div>
      </div>
    </div>
  );
}

<<<<<<< HEAD
// =====================================================
// STAT CHIP
// =====================================================
function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 py-2.5">
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ background: `${color}22`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
          {label}
        </div>
        <div className="truncate text-[13px] font-bold text-[var(--y-text)] tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// GOOGLE DRIVE LOGO
// =====================================================
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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