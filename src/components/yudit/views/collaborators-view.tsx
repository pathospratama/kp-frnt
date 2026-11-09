// src/components/yudit/views/collaborators-view.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  // Existing
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  KeyRound,
  UserX,
  UserCheck,
  Mail,
  Copy,
  Check,
  Loader2,
  Search,
  AlertCircle,
  Users,
  X,
  Info,
  RefreshCw,
  UserRound,
  // ⭐ NEW — untuk statistik
  BarChart3,
  Upload,
  PencilLine,
  Download,
  Eye,
  Share2,
  FileCog,
  FileText,
  Inbox,
  ChevronDown,
  Crown,
  Clock,
  TrendingUp,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";

import {
  useYudit,
  canManageWorkspace,
  isOwner as isOwnerFn,
} from "@/lib/yudit/store";
import {
  listCollaborators,
  inviteCollaborator,
  updateCollaborator,
  removeCollaborator,
  // ⭐ NEW — statistik
  getCollaboratorStats,
  getWorkspaceStatsSummary,
  listCollaboratorUploads,
  listCollaboratorEdits,
  type CollaboratorStats,
  type CollaboratorUpload,
  type CollaboratorEdit,
  type WorkspaceStatsSummary,
} from "@/lib/api/collaborators";
import { ApiError } from "@/lib/api/client";
import type { Collaborator } from "@/lib/yudit/types";
import type { EmailDeliveryResult } from "@/lib/api/collaborators";
import { formatBytes, formatDate, formatDateTime } from "@/lib/yudit/utils";
import { cn } from "@/lib/utils";

// =====================================================
// TYPES
// =====================================================
type ViewMode = "list" | "stats";

// =====================================================
// UTILS
// =====================================================
async function copyText(
  value: string,
  successMessage: string,
): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API tidak tersedia");
    }
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
    return true;
  } catch {
    toast.error("Tidak dapat menyalin. Periksa izin clipboard browser.");
    return false;
  }
}

function getInitial(value?: string | null): string {
  const normalized = value?.trim();
  return normalized ? normalized.charAt(0).toUpperCase() : "?";
}

function parseInviteError(err: unknown): {
  title: string;
  message: string;
  hint?: string;
} {
  if (!(err instanceof ApiError)) {
    return {
      title: "Gagal Mengundang",
      message: "Terjadi kesalahan tidak terduga. Coba lagi.",
    };
  }

  const detail = err.detail || "";
  const detailLower = detail.toLowerCase();
  const status = err.status;

  if (status === 400 && detailLower.includes("email")) {
    if (
      detailLower.includes("sudah terdaftar") ||
      detailLower.includes("already") ||
      detailLower.includes("duplicate")
    ) {
      return {
        title: "Email Sudah Terdaftar",
        message: detail || "Email ini sudah ada di sistem.",
        hint: "Coba gunakan email lain, atau minta user tersebut login dengan akunnya.",
      };
    }
    if (detailLower.includes("format") || detailLower.includes("valid")) {
      return {
        title: "Format Email Tidak Valid",
        message: detail || "Format email tidak valid.",
        hint: "Periksa kembali penulisan email (contoh: nama@domain.com).",
      };
    }
  }

  if (status === 400 && detailLower.includes("role")) {
    return {
      title: "Role Tidak Valid",
      message: detail,
      hint: "Pilih 'member' atau 'super_admin'.",
    };
  }

  if (status === 400) {
    return {
      title: "Data Tidak Valid",
      message: detail || "Data yang dikirim tidak valid.",
      hint: "Periksa kembali form dan coba lagi.",
    };
  }

  if (status === 401) {
    return {
      title: "Sesi Berakhir",
      message: "Sesi login Anda sudah berakhir. Silakan login ulang.",
    };
  }

  if (status === 403) {
    return {
      title: "Akses Ditolak",
      message:
        detail ||
        "Anda tidak punya izin untuk mengundang collaborator dengan role ini.",
      hint:
        detailLower.includes("super_admin")
          ? "Hanya owner yang bisa membuat super_admin."
          : "Hubungi owner workspace.",
    };
  }

  if (status >= 500) {
    return {
      title: "Server Error",
      message: detail || "Terjadi kesalahan di server. Coba lagi nanti.",
      hint: "Jika terus terjadi, hubungi administrator.",
    };
  }

  return {
    title: "Gagal Mengundang",
    message: detail || "Terjadi kesalahan.",
  };
}

// =====================================================
// ⭐ MAIN VIEW
// =====================================================
export function CollaboratorsView() {
  const user = useYudit((state) => state.user);
  const showConfirm = useYudit((state) => state.showConfirm);

  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // ⭐ canManage = full access; member = read-only
  const canManage = canManageWorkspace(user);
  const isOwner = isOwnerFn(user);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listCollaborators();
      setCollabs(Array.isArray(result) ? result : []);
    } catch (error: unknown) {
      const message =
        error instanceof ApiError
          ? error.detail
          : "Gagal memuat daftar collaborator";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return collabs;

    return collabs.filter((collaborator) => {
      const email = collaborator.email?.toLocaleLowerCase() ?? "";
      const username = collaborator.username?.toLocaleLowerCase() ?? "";
      return email.includes(query) || username.includes(query);
    });
  }, [collabs, search]);

  const stats = useMemo(
    () => ({
      total: collabs.length,
      superAdmins: collabs.filter((item) => item.role === "super_admin")
        .length,
      active: collabs.filter((item) => item.is_active).length,
      pendingPassword: collabs.filter(
        (item) => item.must_change_password,
      ).length,
    }),
    [collabs],
  );

  // =====================================================
  // HANDLERS (sama seperti sebelumnya)
  // =====================================================
  const handleToggleActive = (collaborator: Collaborator) => {
    if (!canManage) {
      toast.error("Hanya owner/super admin yang bisa ubah status");
      return;
    }
    showConfirm(
      collaborator.is_active ? "Nonaktifkan akun?" : "Aktifkan akun?",
      collaborator.is_active
        ? `${collaborator.email} tidak akan bisa login sampai diaktifkan kembali.`
        : `${collaborator.email} akan bisa login kembali.`,
      async () => {
        try {
          await updateCollaborator(collaborator.id, {
            is_active: !collaborator.is_active,
          });
          toast.success(
            collaborator.is_active
              ? "Akun berhasil dinonaktifkan"
              : "Akun berhasil diaktifkan",
          );
          await load();
        } catch (error: any) {
          toast.error(error?.detail || "Gagal mengubah status akun");
        }
      },
    );
  };

  const handleResetPassword = (collaborator: Collaborator) => {
    if (!canManage) {
      toast.error("Hanya owner/super admin yang bisa reset password");
      return;
    }
    showConfirm(
      "Reset password collaborator?",
      `Password ${collaborator.email} akan direset menjadi password sementara yang unik dan wajib diganti saat login berikutnya.`,
      async () => {
        try {
          const result = await updateCollaborator(collaborator.id, {
            reset_password: true,
          });
          if (result.email_delivery?.sent) {
            toast.success(
              "Password direset dan email kredensial diterima oleh Gmail API",
            );
          } else {
            const temporaryPassword = result.temporary_password || "";
            if (temporaryPassword && navigator.clipboard?.writeText) {
              try {
                await navigator.clipboard.writeText(temporaryPassword);
                toast.error(
                  `Password sudah direset, tetapi email gagal (${result.email_delivery?.code || "unknown"}). Password sementara disalin ke clipboard.`,
                );
              } catch {
                toast.error(
                  `Password sudah direset tetapi email gagal. Kode: ${result.email_delivery?.code || "unknown"}.`,
                );
              }
            } else {
              toast.error(
                `Password sudah direset tetapi email gagal. Kode: ${result.email_delivery?.code || "unknown"}.`,
              );
            }
          }
          await load();
        } catch (error: any) {
          toast.error(error?.detail || "Gagal mereset password");
        }
      },
    );
  };

  const handleChangeRole = (collaborator: Collaborator) => {
    if (!canManage) {
      toast.error("Hanya owner yang bisa ubah role");
      return;
    }
    const nextRole =
      collaborator.role === "super_admin" ? "member" : "super_admin";
    showConfirm(
      `Ubah menjadi ${nextRole === "super_admin" ? "Super Admin" : "Member"}?`,
      nextRole === "super_admin"
        ? `${collaborator.email} akan dapat mengelola collaborator dan akun Google Drive.`
        : `${collaborator.email} hanya dapat mengelola dokumen yang ditugaskan.`,
      async () => {
        try {
          await updateCollaborator(collaborator.id, { role: nextRole });
          toast.success("Role collaborator berhasil diperbarui");
          await load();
        } catch (error: any) {
          toast.error(error?.detail || "Gagal mengubah role");
        }
      },
    );
  };

  const handleRemove = (collaborator: Collaborator) => {
    if (!canManage) {
      toast.error("Hanya owner yang bisa hapus collaborator");
      return;
    }
    showConfirm(
      "Hapus collaborator?",
      `${collaborator.email} akan dihapus permanen. Assignment dokumen miliknya juga akan dicabut.`,
      async () => {
        try {
          await removeCollaborator(collaborator.id);
          toast.success("Collaborator berhasil dihapus");
          await load();
        } catch (error: any) {
          toast.error(error?.detail || "Gagal menghapus collaborator");
        }
      },
    );
  };

  return (
    <section className="y-anim-fade min-w-0 space-y-5">
      {/* =====================================================
          HEADER
          ===================================================== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgba(249,91,47,0.12)] text-[var(--y-primary)]">
              <Users size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--y-text)]">
              Collaborators
            </h1>
          </div>
          <p className="text-[13px] text-[var(--y-text-dim)]">
            {canManage
              ? "Kelola anggota tim, hak akses & statistik aktivitas."
              : "Daftar anggota workspace (read-only)."}
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] font-semibold text-[var(--y-text-dim)] shadow-sm transition-colors hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            Refresh
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="y-gradient-brand y-glow-primary inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 sm:flex-none"
            >
              <UserPlus size={15} />
              Undang Collaborator
            </button>
          )}
        </div>
      </div>

      {/* ⭐ Info banner untuk member */}
      {!canManage && (
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--y-border-soft)] bg-[rgba(99,102,241,0.06)] p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(99,102,241,0.15)]">
            <Info size={16} className="text-[var(--y-primary)]" />
          </div>
          <div className="text-[13px] leading-relaxed text-[var(--y-text-dim)]">
            <b className="text-[var(--y-text)]">Mode read-only.</b> Hanya
            owner/super admin yang bisa mengundang, mengubah role, atau
            menghapus collaborator. Statistik tim juga hanya untuk manager.
          </div>
        </div>
      )}

      {/* =====================================================
          ⭐ VIEW MODE TABS — Hanya untuk owner/super_admin
          ===================================================== */}
      {canManage && (
        <div className="inline-flex gap-1 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
              viewMode === "list"
                ? "bg-[var(--y-primary)] text-white"
                : "text-[var(--y-text-dim)] hover:text-[var(--y-text)]",
            )}
          >
            <Users size={13} />
            Daftar Collaborators
          </button>
          <button
            onClick={() => setViewMode("stats")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
              viewMode === "stats"
                ? "bg-[var(--y-primary)] text-white"
                : "text-[var(--y-text-dim)] hover:text-[var(--y-text)]",
            )}
          >
            <BarChart3 size={13} />
            Statistik Tim
          </button>
        </div>
      )}

      {/* =====================================================
          CONTENT
          ===================================================== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === "list" ? (
            <>
              {/* Stats summary */}
              <div className="mb-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard
                  label="Total"
                  value={stats.total}
                  icon={<Users size={16} />}
                  color="#6366f1"
                  helper="Seluruh collaborator"
                />
                <StatCard
                  label="Super Admin"
                  value={stats.superAdmins}
                  icon={<ShieldCheck size={16} />}
                  color="#d97706"
                  helper="Akses pengelolaan"
                />
                <StatCard
                  label="Aktif"
                  value={stats.active}
                  icon={<UserCheck size={16} />}
                  color="#059669"
                  helper="Akun dapat login"
                />
                <StatCard
                  label="Perlu Ganti Password"
                  value={stats.pendingPassword}
                  icon={<KeyRound size={16} />}
                  color="#e11d48"
                  helper="Password sementara"
                />
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)]"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari berdasarkan email atau username..."
                  className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] pl-10 pr-11 text-sm text-[var(--y-text)] shadow-sm outline-none transition-colors placeholder:text-[var(--y-text-mute)] focus:border-[var(--y-primary)]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-[var(--y-text-mute)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* List collaborators */}
              {loading ? (
                <div className="grid min-h-44 place-items-center rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)]">
                  <div className="flex items-center gap-3 text-sm text-[var(--y-text-dim)]">
                    <Loader2
                      size={20}
                      className="animate-spin text-[var(--y-primary)]"
                    />
                    Memuat collaborator...
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[var(--y-border)] bg-[var(--y-bg-elev)] px-5 py-10 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--y-bg-hover)] text-[var(--y-text-mute)]">
                    <Users size={25} />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-[var(--y-text)]">
                    {search
                      ? "Collaborator tidak ditemukan"
                      : "Belum ada collaborator"}
                  </h3>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--y-text-dim)]">
                    {search
                      ? "Coba kata kunci email atau username yang berbeda."
                      : canManage
                        ? "Undang anggota tim agar mereka dapat mengakses workspace sesuai role."
                        : "Owner belum mengundang anggota tim ke workspace."}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg)] p-2 shadow-sm sm:p-3">
                  <div className="flex flex-col gap-2">
                    {filtered.map((collaborator, index) => (
                      <CollaboratorRow
                        key={collaborator.id}
                        collab={collaborator}
                        isOwner={isOwner}
                        canManage={canManage}
                        index={index}
                        onToggleActive={() =>
                          handleToggleActive(collaborator)
                        }
                        onResetPassword={() =>
                          handleResetPassword(collaborator)
                        }
                        onChangeRole={() => handleChangeRole(collaborator)}
                        onRemove={() => handleRemove(collaborator)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Role info */}
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[rgba(99,102,241,0.18)] bg-[rgba(99,102,241,0.055)] p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgba(99,102,241,0.12)] text-[#6366f1]">
                  <Info size={17} />
                </div>
                <div className="min-w-0 text-xs leading-relaxed text-[var(--y-text-dim)]">
                  <h3 className="font-bold text-[var(--y-text)]">
                    Tentang role collaborator
                  </h3>
                  <p className="mt-1">
                    <strong className="font-semibold text-[var(--y-warn)]">
                      Super Admin
                    </strong>
                    {" — "}dapat mengelola collaborator, akun Google Drive, dan
                    penugasan dokumen.
                  </p>
                  <p className="mt-0.5">
                    <strong className="font-semibold text-[var(--y-primary)]">
                      Member
                    </strong>
                    {" — "}dapat mengunggah dan mengedit dokumen yang
                    ditugaskan oleh owner atau super admin.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <CollaboratorStatsSection />
          )}
        </motion.div>
      </AnimatePresence>

      {canManage && (
        <InviteCollaboratorModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onSuccess={load}
          isOwner={isOwner}
        />
      )}
    </section>
  );
}

// =====================================================
// ⭐ COLLABORATOR STATS SECTION — Hanya owner/super_admin
// =====================================================
function CollaboratorStatsSection() {
  const [summary, setSummary] = useState<WorkspaceStatsSummary | null>(null);
  const [stats, setStats] = useState<CollaboratorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "owner" | "super_admin" | "member"
  >("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, st] = await Promise.all([
        getWorkspaceStatsSummary(),
        getCollaboratorStats(),
      ]);
      setSummary(s);
      setStats(st);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      if (err instanceof ApiError && err.status === 403) {
        setError("Hanya owner/super admin yang bisa melihat statistik tim.");
        return;
      }
      const msg =
        err instanceof ApiError ? err.detail : "Gagal memuat statistik";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let out = stats;
    if (roleFilter !== "all") {
      out = out.filter((s) => s.role === roleFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (s) =>
          s.username.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q),
      );
    }
    return out;
  }, [stats, search, roleFilter]);

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 size={28} className="animate-spin text-[var(--y-primary)]" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] p-6 text-center">
        <AlertCircle
          size={28}
          className="mx-auto mb-2 text-[var(--y-danger)]"
        />
        <p className="text-sm text-[var(--y-text-dim)]">
          {error || "Statistik tidak tersedia"}
        </p>
        <button
          onClick={load}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[12px] font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
        >
          <RefreshCw size={13} />
          Coba Lagi
        </button>
      </div>
    );
  }

  // =====================================================
  // WORKSPACE SUMMARY CARDS
  // =====================================================
  const summaryCards: {
    label: string;
    value: string;
    sub: string;
    Icon: React.ElementType;
    color: string;
    bg: string;
  }[] = [
    {
      label: "Anggota Tim",
      value: String(summary.total_users),
      sub: "Total user workspace",
      Icon: Users,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.12)",
    },
    {
      label: "Total Upload",
      value: String(summary.total_uploads_workspace),
      sub: formatBytes(summary.total_uploads_size_workspace),
      Icon: Upload,
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
    },
    {
      label: "Total Edit",
      value: String(summary.total_edits_workspace),
      sub: "Versi dokumen",
      Icon: PencilLine,
      color: "#22d3ee",
      bg: "rgba(34,211,238,0.12)",
    },
    {
      label: "Download",
      value: String(summary.total_downloads_workspace),
      sub: "File diunduh",
      Icon: Download,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
    },
    {
      label: "Preview",
      value: String(summary.total_previews_workspace),
      sub: "File dilihat",
      Icon: Eye,
      color: "#a855f7",
      bg: "rgba(168,85,247,0.12)",
    },
    {
      label: "Share Link",
      value: String(summary.total_shares_workspace),
      sub: "Link dibuat",
      Icon: Share2,
      color: "#ec4899",
      bg: "rgba(236,72,153,0.12)",
    },
    {
      label: "Konversi",
      value: String(summary.total_conversions_workspace),
      sub: "File dikonversi",
      Icon: FileCog,
      color: "#e11d48",
      bg: "rgba(225,29,72,0.12)",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-[var(--y-border-soft)] pb-3">
        <h2 className="text-base font-bold text-[var(--y-text)]">
          Statistik Tim
        </h2>
        <p className="text-[12px] text-[var(--y-text-dim)]">
          Ringkasan aktivitas seluruh anggota workspace per user
        </p>
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-2.5 text-[11px] font-semibold text-[var(--y-text-dim)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Workspace summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {summaryCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] p-3.5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--y-text-mute)]">
                {c.label}
              </span>
              <div
                className="grid h-7 w-7 place-items-center rounded-lg"
                style={{ background: c.bg, color: c.color }}
              >
                <c.Icon size={13} />
              </div>
            </div>
            <div
              className="text-xl font-bold tabular-nums"
              style={{ color: c.color }}
            >
              {c.value}
            </div>
            <div className="mt-0.5 truncate text-[10.5px] text-[var(--y-text-mute)]">
              {c.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex gap-1 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] p-1">
          {(
            [
              { key: "all", label: "Semua" },
              { key: "owner", label: "Owner" },
              { key: "super_admin", label: "Super Admin" },
              { key: "member", label: "Member" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors",
                roleFilter === f.key
                  ? "bg-[var(--y-primary)] text-white"
                  : "text-[var(--y-text-dim)] hover:text-[var(--y-text)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email user…"
            className="y-focus h-9 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] pl-9 pr-9 text-[12px] text-[var(--y-text)] placeholder:text-[var(--y-text-mute)] outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] hover:text-[var(--y-text)]"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Per-user list */}
      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-[var(--y-border)] py-12 text-center">
          <Inbox size={28} className="mb-2 text-[var(--y-text-mute)]" />
          <p className="text-[13px] font-semibold text-[var(--y-text-dim)]">
            {search || roleFilter !== "all"
              ? "Tidak ada user yang cocok"
              : "Belum ada user di workspace"}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--y-text-mute)]">
            {search || roleFilter !== "all"
              ? "Coba reset filter atau ubah kata kunci."
              : "Undang collaborator untuk melihat statistik mereka di sini."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((s, i) => (
            <UserStatsCard key={s.user_id} stats={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// ⭐ USER STATS CARD — Per user dengan dropdown
// =====================================================
function UserStatsCard({
  stats,
  index,
}: {
  stats: CollaboratorStats;
  index: number;
}) {
  const [openUploads, setOpenUploads] = useState(false);
  const [openEdits, setOpenEdits] = useState(false);
  const [uploads, setUploads] = useState<CollaboratorUpload[]>([]);
  const [edits, setEdits] = useState<CollaboratorEdit[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [loadingEdits, setLoadingEdits] = useState(false);
  const [loadedUploads, setLoadedUploads] = useState(false);
  const [loadedEdits, setLoadedEdits] = useState(false);

  // Lazy load uploads saat dropdown dibuka
  useEffect(() => {
    if (!openUploads || loadedUploads) return;
    setLoadingUploads(true);
    listCollaboratorUploads(stats.user_id, 50)
      .then((data) => {
        setUploads(data);
        setLoadedUploads(true);
      })
      .catch(() => toast.error("Gagal memuat upload"))
      .finally(() => setLoadingUploads(false));
  }, [openUploads, loadedUploads, stats.user_id]);

  // Lazy load edits saat dropdown dibuka
  useEffect(() => {
    if (!openEdits || loadedEdits) return;
    setLoadingEdits(true);
    listCollaboratorEdits(stats.user_id, 50)
      .then((data) => {
        setEdits(data);
        setLoadedEdits(true);
      })
      .catch(() => toast.error("Gagal memuat edit"))
      .finally(() => setLoadingEdits(false));
  }, [openEdits, loadedEdits, stats.user_id]);

  const roleBadge = {
    owner: {
      label: "OWNER",
      bg: "rgba(239,68,68,0.15)",
      color: "#ef4444",
      icon: <Crown size={10} />,
    },
    super_admin: {
      label: "SUPER ADMIN",
      bg: "rgba(245,158,11,0.15)",
      color: "#f59e0b",
      icon: <ShieldCheck size={10} />,
    },
    member: {
      label: "MEMBER",
      bg: "rgba(99,102,241,0.15)",
      color: "#6366f1",
      icon: <Shield size={10} />,
    },
  }[stats.role] || {
    label: stats.role.toUpperCase(),
    bg: "rgba(100,116,139,0.15)",
    color: "#94a3b8",
    icon: null,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="overflow-hidden rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)]"
    >
      {/* Header user */}
      <div className="flex items-start gap-3 border-b border-[var(--y-border-soft)] p-3.5">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-sm",
            stats.role === "super_admin"
              ? "bg-amber-500"
              : stats.role === "owner"
                ? "bg-gradient-to-br from-red-500 to-orange-500"
                : "bg-[var(--y-primary)]",
            !stats.is_active && "grayscale",
          )}
        >
          {stats.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stats.avatar_url}
              alt={stats.username}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            getInitial(stats.username)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-bold text-[var(--y-text)]">
              {stats.username}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: roleBadge.bg, color: roleBadge.color }}
            >
              {roleBadge.icon}
              {roleBadge.label}
            </span>
            {!stats.is_active && (
              <span className="rounded-full bg-[rgba(239,68,68,0.15)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--y-danger)]">
                NONAKTIF
              </span>
            )}
            {stats.must_change_password && (
              <span className="rounded-full bg-[rgba(245,158,11,0.15)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--y-warn)]">
                PERLU GANTI PW
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-[var(--y-text-mute)]">
            {stats.email}
          </div>
          {stats.last_login_at && (
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--y-text-mute)]">
              <Clock size={9} />
              Login terakhir {formatDateTime(stats.last_login_at)}
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 p-3.5 sm:grid-cols-6">
        <MiniStat
          icon={<Upload size={12} />}
          label="Upload"
          value={stats.total_uploads}
          color="#6366f1"
        />
        <MiniStat
          icon={<PencilLine size={12} />}
          label="Edit"
          value={stats.total_edits}
          color="#10b981"
        />
        <MiniStat
          icon={<Download size={12} />}
          label="Download"
          value={stats.total_downloads}
          color="#22d3ee"
        />
        <MiniStat
          icon={<Eye size={12} />}
          label="Preview"
          value={stats.total_previews}
          color="#f59e0b"
        />
        <MiniStat
          icon={<Share2 size={12} />}
          label="Share"
          value={stats.total_shares}
          color="#a855f7"
        />
        <MiniStat
          icon={<FileCog size={12} />}
          label="Konversi"
          value={stats.total_conversions}
          color="#ec4899"
        />
      </div>

      {/* Contributed size */}
      <div className="mx-3.5 mb-3 flex items-center gap-2 rounded-lg border border-[var(--y-border-soft)] bg-[var(--y-bg)] px-2.5 py-1.5 text-[11px]">
        <HardDrive size={11} className="text-[var(--y-text-mute)]" />
        <span className="text-[var(--y-text-dim)]">
          Kontribusi storage:
        </span>
        <span className="font-bold text-[var(--y-accent)]">
          {formatBytes(stats.contributed_size)}
        </span>
        <span className="ml-auto text-[10px] text-[var(--y-text-mute)]">
          {stats.total_uploadssize_placeholder}
        </span>
      </div>

      {/* Dropdowns */}
      <div className="border-t border-[var(--y-border-soft)]">
        {/* Uploads dropdown */}
        <StatsDropdown
          open={openUploads}
          onToggle={() => setOpenUploads((v) => !v)}
          icon={<Upload size={13} />}
          iconColor="#6366f1"
          title="Dokumen Upload"
          count={stats.total_uploads}
          totalSize={stats.total_uploads_size}
          loading={loadingUploads}
          empty={loadedUploads && uploads.length === 0}
          emptyText="User ini belum upload file"
        >
          {uploads.map((u) => (
            <UploadItem key={u.id} upload={u} />
          ))}
        </StatsDropdown>

        {/* Edits dropdown */}
        <StatsDropdown
          open={openEdits}
          onToggle={() => setOpenEdits((v) => !v)}
          icon={<PencilLine size={13} />}
          iconColor="#10b981"
          title="Dokumen Edit"
          count={stats.total_edited_files}
          totalSize={null}
          loading={loadingEdits}
          empty={loadedEdits && edits.length === 0}
          emptyText="User ini belum edit dokumen"
        >
          {edits.map((e) => (
            <EditItem key={e.file_id} edit={e} />
          ))}
        </StatsDropdown>
      </div>
    </motion.div>
  );
}

// =====================================================
// ⭐ MINI STAT
// =====================================================
function MiniStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-[var(--y-border-soft)] bg-[var(--y-bg)] p-1.5">
      <div style={{ color }} className="mb-0.5">
        {icon}
      </div>
      <div
        className="text-sm font-bold tabular-nums leading-none"
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[9px] font-semibold uppercase text-[var(--y-text-mute)]">
        {label}
      </div>
    </div>
  );
}

// =====================================================
// ⭐ STATS DROPDOWN
// =====================================================
function StatsDropdown({
  open,
  onToggle,
  icon,
  iconColor,
  title,
  count,
  totalSize,
  loading,
  empty,
  emptyText,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  count: number;
  totalSize: number | null;
  loading: boolean;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--y-bg-hover)]"
      >
        <div
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md"
          style={{ background: `${iconColor}22`, color: iconColor }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold text-[var(--y-text)]">
            {title}
          </div>
          <div className="text-[10px] text-[var(--y-text-mute)]">
            {count} file
            {totalSize != null && totalSize > 0 && (
              <> · {formatBytes(totalSize)}</>
            )}
          </div>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-[var(--y-text-mute)] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto border-t border-[var(--y-border-soft)] p-1.5">
              {loading ? (
                <div className="grid place-items-center py-4">
                  <Loader2
                    size={16}
                    className="animate-spin text-[var(--y-primary)]"
                  />
                </div>
              ) : empty ? (
                <div className="grid place-items-center py-4 text-center">
                  <Inbox size={18} className="mb-1 text-[var(--y-text-mute)]" />
                  <p className="text-[10.5px] text-[var(--y-text-mute)]">
                    {emptyText}
                  </p>
                </div>
              ) : (
                children
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// ⭐ UPLOAD ITEM
// =====================================================
function UploadItem({ upload }: { upload: CollaboratorUpload }) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--y-bg-hover)]">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[rgba(99,102,241,0.1)] text-[#6366f1]">
        <FileText size={11} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[11px] font-semibold text-[var(--y-text)]"
          title={upload.name}
        >
          {upload.name}
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[9.5px] text-[var(--y-text-mute)]">
          <span className="tabular-nums">{formatBytes(upload.size)}</span>
          {upload.category && (
            <>
              <span>•</span>
              <span className="truncate">{upload.category}</span>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0 text-[9.5px] text-[var(--y-text-mute)]">
        {formatDate(upload.created_at)}
      </div>
    </div>
  );
}

// =====================================================
// ⭐ EDIT ITEM
// =====================================================
function EditItem({ edit }: { edit: CollaboratorEdit }) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--y-bg-hover)]">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[rgba(16,185,129,0.1)] text-[#10b981]">
        <PencilLine size={11} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[11px] font-semibold text-[var(--y-text)]"
          title={edit.file_name}
        >
          {edit.file_name}
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[9.5px] text-[var(--y-text-mute)]">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[rgba(16,185,129,0.15)] px-1 py-0.5 font-bold text-[#10b981]">
            {edit.edit_count}× edit
          </span>
          {edit.file_size != null && (
            <span className="tabular-nums">
              {formatBytes(edit.file_size)}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-[9.5px] text-[var(--y-text-mute)]">
        {formatDate(edit.last_edited_at)}
      </div>
    </div>
  );
}

// =====================================================
// STAT CARD (existing)
// =====================================================
function StatCard({
  label,
  value,
  icon,
  color,
  helper,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  helper: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-3.5 shadow-sm transition-shadow hover:shadow-md sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--y-text-mute)] sm:text-[11px]">
          {label}
        </span>
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold leading-none tabular-nums text-[var(--y-text)]">
        {value}
      </div>
      <p className="mt-2 truncate text-[10px] text-[var(--y-text-mute)]">
        {helper}
      </p>
    </article>
  );
}

// =====================================================
// COLLABORATOR ROW (existing, tidak diubah)
// =====================================================
function CollaboratorRow({
  collab,
  isOwner,
  canManage,
  index,
  onToggleActive,
  onResetPassword,
  onChangeRole,
  onRemove,
}: {
  collab: Collaborator;
  isOwner: boolean;
  canManage: boolean;
  index: number;
  onToggleActive: () => void;
  onResetPassword: () => void;
  onChangeRole: () => void;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    const ok = await copyText(
      collab.email,
      "Email collaborator berhasil disalin",
    );
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.2), duration: 0.2 }}
      className={cn(
        "group flex min-w-0 flex-col gap-3 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-3 shadow-[0_1px_2px_rgba(15,23,42,0.035)] transition-all duration-150",
        "hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:shadow-sm",
        !collab.is_active && "opacity-75",
        "sm:flex-row sm:items-center sm:gap-3.5 sm:px-3.5 sm:py-3",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-sm",
            collab.role === "super_admin"
              ? "bg-amber-500"
              : "y-gradient-brand",
            !collab.is_active && "grayscale",
          )}
        >
          {getInitial(collab.username)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="max-w-full truncate text-sm font-bold text-[var(--y-text)]">
              {collab.username || "Tanpa username"}
            </h3>
            <RoleBadge role={collab.role} />
            {!collab.is_active && (
              <StatusBadge kind="inactive">NONAKTIF</StatusBadge>
            )}
            {collab.must_change_password && (
              <StatusBadge kind="warning">PERLU GANTI PW</StatusBadge>
            )}
          </div>

          <button
            type="button"
            onClick={() => void handleCopyEmail()}
            className="group/email mt-1 inline-flex max-w-full items-center gap-1.5 rounded-md text-left text-[11px] text-[var(--y-text-dim)] transition-colors hover:text-[var(--y-primary)]"
          >
            <Mail size={11} className="shrink-0" />
            <span className="max-w-[min(68vw,420px)] truncate">
              {collab.email}
            </span>
            {copied ? (
              <Check size={11} className="shrink-0 text-[var(--y-success)]" />
            ) : (
              <Copy
                size={10}
                className="shrink-0 opacity-0 transition-opacity group-hover/email:opacity-100"
              />
            )}
          </button>
        </div>
      </div>

      {canManage && (
        <div className="grid grid-cols-2 gap-1.5 pl-[52px] sm:ml-auto sm:flex sm:shrink-0 sm:justify-end sm:pl-0">
          {isOwner && (
            <ActionButton
              label={
                collab.role === "super_admin"
                  ? "Jadikan Member"
                  : "Jadikan Super Admin"
              }
              onClick={onChangeRole}
              tone="neutral"
            >
              {collab.role === "super_admin" ? (
                <ShieldAlert size={14} />
              ) : (
                <Shield size={14} />
              )}
              <span className="sm:hidden">Role</span>
            </ActionButton>
          )}
          <ActionButton
            label="Reset password"
            onClick={onResetPassword}
            tone="warning"
          >
            <KeyRound size={14} />
            <span className="sm:hidden">Reset PW</span>
          </ActionButton>
          <ActionButton
            label={collab.is_active ? "Nonaktifkan akun" : "Aktifkan akun"}
            onClick={onToggleActive}
            tone="neutral"
          >
            {collab.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
            <span className="sm:hidden">
              {collab.is_active ? "Nonaktifkan" : "Aktifkan"}
            </span>
          </ActionButton>
          {isOwner && (
            <ActionButton
              label="Hapus collaborator"
              onClick={onRemove}
              tone="danger"
            >
              <Trash2 size={14} />
              <span className="sm:hidden">Hapus</span>
            </ActionButton>
          )}
        </div>
      )}
    </motion.article>
  );
}

// =====================================================
// BADGES
// =====================================================
export function RoleBadge({ role }: { role: "super_admin" | "member" }) {
  const isSuperAdmin = role === "super_admin";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide",
        isSuperAdmin
          ? "border-amber-500/25 bg-amber-500/10 text-[var(--y-warn)]"
          : "border-indigo-500/20 bg-indigo-500/10 text-[var(--y-primary)]",
      )}
    >
      {isSuperAdmin ? <ShieldCheck size={10} /> : <Shield size={10} />}
      {isSuperAdmin ? "SUPER ADMIN" : "MEMBER"}
    </span>
  );
}

function StatusBadge({
  kind,
  children,
}: {
  kind: "inactive" | "warning";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide",
        kind === "warning"
          ? "border-amber-500/25 bg-amber-500/10 text-[var(--y-warn)]"
          : "border-rose-500/25 bg-rose-500/10 text-[var(--y-danger)]",
      )}
    >
      {children}
    </span>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  tone: "neutral" | "warning" | "danger";
}) {
  const toneClass = {
    neutral:
      "border-[var(--y-border)] bg-[var(--y-bg-elev)] text-[var(--y-text-dim)] hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
    warning:
      "border-amber-500/25 bg-amber-500/5 text-[var(--y-warn)] hover:border-amber-500/50 hover:bg-amber-500/10",
    danger:
      "border-rose-500/25 bg-rose-500/5 text-[var(--y-danger)] hover:border-rose-500/50 hover:bg-rose-500/10",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold transition-all",
        toneClass,
      )}
    >
      {children}
    </button>
  );
}

// =====================================================
// INVITE MODAL (existing — tidak diubah)
// =====================================================
function InviteCollaboratorModal({
  open,
  onClose,
  onSuccess,
  isOwner,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  isOwner: boolean;
}) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"member" | "super_admin">("member");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    email: string;
    password: string;
    emailDelivery: EmailDeliveryResult;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [inlineError, setInlineError] = useState<{
    title: string;
    message: string;
    hint?: string;
  } | null>(null);

  const reset = () => {
    setEmail("");
    setUsername("");
    setRole("member");
    setCreated(null);
    setShowPassword(false);
    setCopiedAll(false);
    setInlineError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setInlineError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Email collaborator wajib diisi");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setInlineError({
        title: "Format Email Tidak Valid",
        message: "Email tidak sesuai format standar.",
        hint: "Contoh: nama@domain.com",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await inviteCollaborator({
        email: normalizedEmail,
        username: username.trim() || undefined,
        role,
      });
      setCreated({
        email: result.user.email,
        password: result.temporary_password,
        emailDelivery: result.email_delivery,
      });
      if (result.email_delivery?.sent) {
        toast.success(
          "Collaborator dibuat dan permintaan email diterima oleh Gmail API",
        );
      } else {
        toast.error(
          `Akun dibuat, tetapi email gagal: ${result.email_delivery?.code || "UNKNOWN"} (${result.email_delivery?.stage || "UNKNOWN"}). Kredensial tersedia di dialog ini.`,
        );
      }
      await onSuccess();
    } catch (err: unknown) {
      const parsed = parseInviteError(err);
      setInlineError(parsed);
      toast.error(parsed.message, { duration: 8000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!created) return;
    const credentials = [
      `Email: ${created.email}`,
      `Password: ${created.password}`,
      "",
      `Login: ${window.location.origin}`,
      "",
      "Segera ganti password setelah login pertama.",
    ].join("\n");

    const ok = await copyText(credentials, "Kredensial berhasil disalin");
    if (ok) {
      setCopiedAll(true);
      window.setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[998] grid place-items-center overflow-y-auto p-4 sm:p-6"
          style={{
            background: "rgba(15,23,42,0.58)",
            backdropFilter: "blur(5px)",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
            className="y-glass-strong relative my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5 shadow-2xl sm:p-6"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-[var(--y-text-mute)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] disabled:opacity-50"
            >
              <X size={17} />
            </button>

            {created ? (
              <div>
                <div className="pr-8 text-center">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-[var(--y-success)]">
                    <Check size={27} />
                  </div>
                  <h2 className="text-base font-bold text-[var(--y-text)]">
                    Collaborator ditambahkan
                  </h2>
                  <p className="mb-5 mt-1 text-sm leading-relaxed text-[var(--y-text-dim)]">
                    Simpan kredensial sementara berikut dan berikan kepada
                    anggota yang diundang.
                  </p>
                </div>

                <div className="mb-3 space-y-3 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] p-3.5">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--y-text-mute)]">
                      Email
                    </p>
                    <p className="break-all font-mono text-sm text-[var(--y-text)]">
                      {created.email}
                    </p>
                  </div>
                  <div className="border-t border-[var(--y-border-soft)] pt-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--y-text-mute)]">
                        Password sementara
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--y-primary)] hover:underline"
                      >
                        {showPassword ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <p className="font-mono text-sm font-bold tracking-wide text-[var(--y-text)]">
                      {showPassword ? created.password : "••••••"}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "mb-3 rounded-xl border p-3 text-xs leading-relaxed",
                    created.emailDelivery?.sent
                      ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/25 bg-red-500/8 text-red-700 dark:text-red-300",
                  )}
                >
                  <p className="font-bold">
                    {created.emailDelivery?.sent
                      ? "Status email: diterima oleh Gmail API"
                      : `Status email: gagal (${created.emailDelivery?.code || "UNKNOWN"})`}
                  </p>
                  <p className="mt-1">
                    {created.emailDelivery?.message ||
                      "Tidak ada detail dari layanan email."}
                  </p>
                  {created.emailDelivery?.request_id && (
                    <p className="mt-1 break-all font-mono text-[10px] opacity-80">
                      Request ID: {created.emailDelivery.request_id}
                    </p>
                  )}
                </div>

                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-xs leading-relaxed text-[var(--y-warn)]">
                  <Info size={15} className="mt-0.5 shrink-0" />
                  <p>
                    Anggota wajib mengganti password sementara setelah
                    berhasil login pertama kali.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleCopyCredentials()}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm font-semibold text-[var(--y-text)] transition-colors hover:bg-[var(--y-bg-hover)]"
                  >
                    {copiedAll ? (
                      <Check
                        size={15}
                        className="text-[var(--y-success)]"
                      />
                    ) : (
                      <Copy size={15} />
                    )}
                    {copiedAll ? "Tersalin" : "Salin kredensial"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="y-gradient-brand inline-flex h-10 flex-1 items-center justify-center rounded-xl px-3 text-sm font-semibold text-white"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="pt-1">
                <div className="mb-5 flex items-start gap-3 pr-8">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgba(249,91,47,0.12)] text-[var(--y-primary)]">
                    <UserPlus size={19} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--y-text)]">
                      Undang collaborator
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--y-text-dim)]">
                      Anggota baru akan dibuat dengan password sementara dan
                      wajib menggantinya saat login pertama.
                    </p>
                  </div>
                </div>

                {inlineError && (
                  <div
                    className="mb-4 rounded-xl border border-red-500/30 bg-red-500/8 p-3"
                    role="alert"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        size={15}
                        className="mt-0.5 shrink-0 text-[var(--y-danger)]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--y-danger)]">
                          {inlineError.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--y-text-dim)]">
                          {inlineError.message}
                        </p>
                        {inlineError.hint && (
                          <p className="mt-1 text-[11px] italic text-[var(--y-text-mute)]">
                            💡 {inlineError.hint}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setInlineError(null)}
                        className="text-[var(--y-text-mute)] hover:text-[var(--y-text)]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mb-4 space-y-1.5">
                  <label
                    htmlFor="collaborator-email"
                    className="text-[11px] font-bold uppercase tracking-wide text-[var(--y-text-dim)]"
                  >
                    Email <span className="text-[var(--y-danger)]">*</span>
                  </label>
                  <input
                    id="collaborator-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@instansi.go.id"
                    autoComplete="email"
                    required
                    autoFocus
                    disabled={submitting}
                    className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] px-3.5 text-sm text-[var(--y-text)] outline-none transition-colors placeholder:text-[var(--y-text-mute)] focus:border-[var(--y-primary)] disabled:opacity-60"
                  />
                </div>

                <div className="mb-4 space-y-1.5">
                  <label
                    htmlFor="collaborator-username"
                    className="text-[11px] font-bold uppercase tracking-wide text-[var(--y-text-dim)]"
                  >
                    Username{" "}
                    <span className="font-normal normal-case text-[var(--y-text-mute)]">
                      (opsional)
                    </span>
                  </label>
                  <input
                    id="collaborator-username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Otomatis diambil dari email"
                    autoComplete="off"
                    disabled={submitting}
                    className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] px-3.5 text-sm text-[var(--y-text)] outline-none transition-colors placeholder:text-[var(--y-text-mute)] focus:border-[var(--y-primary)] disabled:opacity-60"
                  />
                </div>

                <fieldset className="mb-5">
                  <legend className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--y-text-dim)]">
                    Role akses
                  </legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <RoleOption
                      active={role === "member"}
                      onClick={() => !submitting && setRole("member")}
                      icon={<UserRound size={17} />}
                      label="Member"
                      desc="Upload dan edit dokumen yang ditugaskan."
                      disabled={submitting}
                    />
                    <RoleOption
                      active={role === "super_admin"}
                      onClick={() =>
                        !submitting && isOwner && setRole("super_admin")
                      }
                      icon={<ShieldCheck size={17} />}
                      label="Super Admin"
                      desc="Kelola collaborator dan akun Google Drive."
                      disabled={!isOwner || submitting}
                    />
                  </div>
                  {!isOwner && (
                    <p className="mt-2 text-[11px] text-[var(--y-text-mute)]">
                      Hanya owner yang dapat mengundang Super Admin.
                    </p>
                  )}
                </fieldset>

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm font-semibold text-[var(--y-text-dim)] transition-colors hover:bg-[var(--y-bg-hover)] disabled:opacity-60"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="y-gradient-brand inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <UserPlus size={15} />
                    )}
                    {submitting ? "Mengundang..." : "Undang collaborator"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RoleOption({
  active,
  onClick,
  icon,
  label,
  desc,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex min-h-[104px] w-full flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all",
        active
          ? "border-[var(--y-primary)] bg-[rgba(249,91,47,0.085)] shadow-[0_0_0_1px_var(--y-primary)]"
          : "border-[var(--y-border)] bg-[var(--y-bg)] hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span
          className={cn(
            "text-[var(--y-text-dim)]",
            active && "text-[var(--y-primary)]",
          )}
        >
          {icon}
        </span>
        {active && <Check size={15} className="text-[var(--y-primary)]" />}
      </span>
      <span className="text-xs font-bold text-[var(--y-text)]">{label}</span>
      <span className="text-[10px] leading-relaxed text-[var(--y-text-dim)]">
        {desc}
      </span>
    </button>
  );
}
