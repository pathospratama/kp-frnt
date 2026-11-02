// src/components/yudit/views/collaborators-view.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  Eye,
  EyeOff,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { useYudit, canManageWorkspace, isOwner as isOwnerFn } from "@/lib/yudit/store";
import {
  listCollaborators,
  inviteCollaborator,
  updateCollaborator,
  removeCollaborator,
} from "@/lib/api/collaborators";
import type { Collaborator } from "@/lib/yudit/types";
import { cn } from "@/lib/utils";

// =====================================================
// MAIN VIEW
// =====================================================
export function CollaboratorsView() {
  const user = useYudit((s) => s.user);
  const showConfirm = useYudit((s) => s.showConfirm);

  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  // Guards
  const canManage = canManageWorkspace(user);
  const isOwner = isOwnerFn(user);

  // =====================================================
  // LOAD
  // =====================================================
  const load = async () => {
    setLoading(true);
    try {
      const res = await listCollaborators();
      setCollabs(res);
    } catch (e: any) {
      toast.error(e?.detail || "Gagal memuat collaborator");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) load();
  }, [canManage]);

  // =====================================================
  // FILTER
  // =====================================================
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return collabs;
    return collabs.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q),
    );
  }, [collabs, search]);

  // =====================================================
  // STATS
  // =====================================================
  const stats = useMemo(
    () => ({
      total: collabs.length,
      superAdmins: collabs.filter((c) => c.role === "super_admin").length,
      active: collabs.filter((c) => c.is_active).length,
      pendingPassword: collabs.filter((c) => c.must_change_password).length,
    }),
    [collabs],
  );

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleToggleActive = (c: Collaborator) => {
    showConfirm(
      c.is_active ? "Nonaktifkan akun?" : "Aktifkan akun?",
      c.is_active
        ? `${c.email} tidak akan bisa login sampai diaktifkan lagi.`
        : `${c.email} akan bisa login kembali.`,
      async () => {
        try {
          await updateCollaborator(c.id, { is_active: !c.is_active });
          toast.success(
            c.is_active ? "Akun dinonaktifkan" : "Akun diaktifkan",
          );
          await load();
        } catch (e: any) {
          toast.error(e?.detail || "Gagal update");
        }
      },
    );
  };

  const handleResetPassword = (c: Collaborator) => {
    showConfirm(
      "Reset password?",
      `Password ${c.email} akan dikembalikan ke "123456" dan wajib diganti saat login berikutnya.`,
      async () => {
        try {
          await updateCollaborator(c.id, { reset_password: true });
          toast.success("Password direset ke 123456");
          await load();
        } catch (e: any) {
          toast.error(e?.detail || "Gagal reset");
        }
      },
    );
  };

  const handleChangeRole = (c: Collaborator) => {
    const newRole = c.role === "super_admin" ? "member" : "super_admin";
    showConfirm(
      `Jadikan ${newRole === "super_admin" ? "Super Admin" : "Member"}?`,
      newRole === "super_admin"
        ? `${c.email} bisa mengelola collaborator dan drive accounts.`
        : `${c.email} hanya bisa upload & edit dokumen yang di-assign.`,
      async () => {
        try {
          await updateCollaborator(c.id, { role: newRole });
          toast.success(`Role diubah ke ${newRole}`);
          await load();
        } catch (e: any) {
          toast.error(e?.detail || "Gagal ubah role");
        }
      },
    );
  };

  const handleRemove = (c: Collaborator) => {
    showConfirm(
      "Hapus collaborator?",
      `${c.email} akan dihapus permanen. Semua assignment dokumennya juga dicabut.`,
      async () => {
        try {
          await removeCollaborator(c.id);
          toast.success("Collaborator dihapus");
          await load();
        } catch (e: any) {
          toast.error(e?.detail || "Gagal hapus");
        }
      },
    );
  };

  // =====================================================
  // GUARD RENDER
  // =====================================================
  if (!canManage) {
    return (
      <div className="grid place-items-center py-20">
        <div className="max-w-sm rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(239,68,68,0.15)]">
            <AlertCircle size={28} className="text-[var(--y-danger)]" />
          </div>
          <h3 className="mb-2 text-base font-semibold text-[var(--y-text)]">
            Akses Ditolak
          </h3>
          <p className="text-sm text-[var(--y-text-dim)]">
            Hanya owner atau super admin yang bisa mengelola collaborator.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="y-anim-fade">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--y-text)]">
            Collaborators
          </h1>
          <p className="text-[13px] text-[var(--y-text-dim)]">
            Kelola tim yang bisa mengakses workspace Anda
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="y-gradient-brand y-glow-primary inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
        >
          <UserPlus size={15} />
          Undang Collaborator
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Users size={15} />}
          color="#6366f1"
        />
        <StatCard
          label="Super Admin"
          value={stats.superAdmins}
          icon={<ShieldCheck size={15} />}
          color="#f59e0b"
        />
        <StatCard
          label="Aktif"
          value={stats.active}
          icon={<UserCheck size={15} />}
          color="#10b981"
        />
        <StatCard
          label="Perlu Ganti PW"
          value={stats.pendingPassword}
          icon={<KeyRound size={15} />}
          color="#ef4444"
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)]"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari email atau username…"
          className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] pl-10 pr-10 text-sm text-[var(--y-text)] placeholder:text-[var(--y-text-mute)] outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] hover:text-[var(--y-text)]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 size={28} className="animate-spin text-[var(--y-primary)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--y-border)] py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--y-bg-elev)]">
            <Users size={28} className="text-[var(--y-text-mute)]" />
          </div>
          <div className="mt-3 text-sm font-semibold text-[var(--y-text-dim)]">
            {search ? "Tidak ada hasil" : "Belum ada collaborator"}
          </div>
          <div className="mt-1 text-xs text-[var(--y-text-mute)]">
            {search
              ? "Coba kata kunci lain"
              : "Klik 'Undang Collaborator' untuk menambah"}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--y-border-soft)] bg-[rgba(17,24,53,0.4)] p-2">
          <div className="flex flex-col gap-1">
            {filtered.map((c, i) => (
              <CollaboratorRow
                key={c.id}
                collab={c}
                isOwner={isOwner}
                                index={i}
                onToggleActive={() => handleToggleActive(c)}
                onResetPassword={() => handleResetPassword(c)}
                onChangeRole={() => handleChangeRole(c)}
                onRemove={() => handleRemove(c)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--y-border-soft)] bg-[rgba(99,102,241,0.05)] p-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(99,102,241,0.15)]">
          <Info size={16} className="text-[var(--y-primary)]" />
        </div>
        <div className="text-[12px] leading-relaxed text-[var(--y-text-dim)]">
          <b className="text-[var(--y-text)]">Tentang role:</b>
          <div className="mt-1 space-y-0.5">
            <div>
              <b className="text-[#f59e0b]">Super Admin</b> — bisa kelola
              collaborator, drive accounts, dan assign dokumen.
            </div>
            <div>
              <b className="text-[var(--y-primary)]">Member</b> — hanya bisa
              upload dan edit dokumen yang di-assign oleh owner/super admin.
            </div>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      <InviteCollaboratorModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={load}
        isOwner={isOwner}
      />
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
          {label}
        </span>
        <div
          className="grid h-7 w-7 place-items-center rounded-lg"
          style={{ background: `${color}22`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-xl font-bold tabular-nums text-[var(--y-text)]">
        {value}
      </div>
    </div>
  );
}

// =====================================================
// COLLABORATOR ROW
// =====================================================
function CollaboratorRow({
  collab,
  isOwner,
  index,
  onToggleActive,
  onResetPassword,
  onChangeRole,
  onRemove,
}: {
  collab: Collaborator;
  isOwner: boolean;
  index: number;
  onToggleActive: () => void;
  onResetPassword: () => void;
  onChangeRole: () => void;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard?.writeText(collab.email).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors",
        "hover:border-[var(--y-border-soft)] hover:bg-[rgba(22,31,63,0.6)]",
        !collab.is_active && "opacity-60",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white",
          collab.role === "super_admin"
            ? "bg-[#f59e0b]"
            : "bg-[var(--y-primary)]",
        )}
      >
        {collab.username.charAt(0).toUpperCase()}
      </div>

      {/* Info (2 baris: nama+badge+status, email) */}
      <div className="min-w-0 flex-1">
        {/* Baris 1: username + badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-[var(--y-text)]">
            {collab.username}
          </span>
          <RoleBadge role={collab.role} />
          {!collab.is_active && (
            <span className="rounded-full bg-[rgba(239,68,68,0.15)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--y-danger)]">
              NONAKTIF
            </span>
          )}
          {collab.must_change_password && (
            <span className="rounded-full bg-[rgba(245,158,11,0.15)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--y-warn)]">
              PERLU GANTI PW
            </span>
          )}
        </div>

        {/* Baris 2: email + copy button */}
        <button
          onClick={copyEmail}
          className="group/email mt-0.5 flex items-center gap-1 text-[11px] text-[var(--y-text-dim)] hover:text-[var(--y-accent)]"
          title="Klik untuk copy email"
        >
          <Mail size={10} />
          <span className="truncate">{collab.email}</span>
          {copied ? (
            <Check size={10} className="text-[var(--y-success)]" />
          ) : (
            <Copy
              size={10}
              className="opacity-0 transition-opacity group-hover/email:opacity-100"
            />
          )}
        </button>
      </div>

      {/* Actions — selalu visible di mobile, hover di desktop */}
      <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        {/* Ubah role — hanya owner */}
        {isOwner && (
          <ActionBtn
            label={
              collab.role === "super_admin"
                ? "Jadikan Member"
                : "Jadikan Super Admin"
            }
            onClick={onChangeRole}
          >
            {collab.role === "super_admin" ? (
              <ShieldAlert size={14} />
            ) : (
              <Shield size={14} />
            )}
          </ActionBtn>
        )}

        {/* Reset password */}
        <ActionBtn
          label="Reset password ke 123456"
          onClick={onResetPassword}
        >
          <KeyRound size={14} />
        </ActionBtn>

        {/* Aktif/nonaktif */}
        <ActionBtn
          label={collab.is_active ? "Nonaktifkan" : "Aktifkan"}
          onClick={onToggleActive}
        >
          {collab.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
        </ActionBtn>

        {/* Hapus — hanya owner */}
        {isOwner && (
          <ActionBtn label="Hapus permanen" onClick={onRemove} danger>
            <Trash2 size={14} />
          </ActionBtn>
        )}
      </div>
    </motion.div>
  );
}

// =====================================================
// ROLE BADGE
// =====================================================
export function RoleBadge({ role }: { role: "super_admin" | "member" }) {
  if (role === "super_admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(245,158,11,0.15)] px-2 py-0.5 text-[9px] font-bold text-[#f59e0b]">
        <ShieldCheck size={9} />
        SUPER ADMIN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(99,102,241,0.15)] px-2 py-0.5 text-[9px] font-bold text-[var(--y-primary)]">
      <Shield size={9} />
      MEMBER
    </span>
  );
}

// =====================================================
// ACTION BUTTON
// =====================================================
function ActionBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md text-[var(--y-text-dim)] transition-colors",
        "hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
        danger && "hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-danger)]",
      )}
    >
      {children}
    </button>
  );
}

// =====================================================
// INVITE MODAL
// =====================================================
function InviteCollaboratorModal({
  open,
  onClose,
  onSuccess,
  isOwner,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isOwner: boolean;
}) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"member" | "super_admin">("member");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const reset = () => {
    setEmail("");
    setUsername("");
    setRole("member");
    setCreated(null);
    setShowPassword(false);
    setCopiedAll(false);
  };

  // Cegah close saat submit
  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await inviteCollaborator({
        email: email.trim(),
        username: username.trim() || undefined,
        role,
      });
      setCreated({
        email: res.user.email,
        password: res.temporary_password,
      });
      toast.success("Collaborator ditambahkan");
      onSuccess();
    } catch (e: any) {
      toast.error(e?.detail || "Gagal menambahkan");
    } finally {
      setSubmitting(false);
    }
  };

  // Copy kredensial lengkap
  const handleCopyCredentials = () => {
    if (!created) return;
    const text = `Email: ${created.email}\nPassword: ${created.password}\n\nLogin: ${window.location.origin}\n\nSegera ganti password setelah login pertama.`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    toast.success("Kredensial disalin");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[998] grid place-items-center p-5"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            className="y-glass-strong y-glow-soft w-full max-w-md rounded-2xl border border-[var(--y-border)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {created ? (
              // ==================== SUCCESS STATE ====================
              <div>
                <div className="text-center">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(16,185,129,0.15)]">
                    <Check size={28} className="text-[var(--y-success)]" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-[var(--y-text)]">
                    Collaborator Ditambahkan
                  </h3>
                  <p className="mb-4 text-sm text-[var(--y-text-dim)]">
                    Berikan kredensial berikut ke collaborator:
                  </p>
                </div>

                {/* Credentials box */}
                <div className="mb-3 space-y-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] p-3 text-left">
                  <div>
                    <div className="text-[10px] font-semibold uppercase text-[var(--y-text-mute)]">
                      Email
                    </div>
                    <div className="font-mono text-sm text-[var(--y-text)] break-all">
                      {created.email}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-semibold uppercase text-[var(--y-text-mute)]">
                        Password Sementara
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="text-[10px] text-[var(--y-primary)] hover:underline"
                      >
                        {showPassword ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm text-[var(--y-warn)]">
                        {showPassword ? created.password : "••••••"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="mb-4 rounded-lg bg-[rgba(245,158,11,0.08)] p-2.5 text-[11px] text-[var(--y-warn)]">
                  ⚠️ Collaborator <b>wajib ganti password</b> saat login
                  pertama.
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyCredentials}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] text-sm font-semibold text-[var(--y-text)] hover:bg-[var(--y-bg-hover)]"
                  >
                    {copiedAll ? (
                      <Check size={15} className="text-[var(--y-success)]" />
                    ) : (
                      <Copy size={15} />
                    )}
                    {copiedAll ? "Tersalin" : "Salin Kredensial"}
                  </button>
                  <button
                    onClick={handleClose}
                    className="y-gradient-brand inline-flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-semibold text-white"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              // ==================== FORM STATE ====================
              <form onSubmit={handleSubmit}>
                <h3 className="mb-1 text-base font-semibold text-[var(--y-text)]">
                  Undang Collaborator
                </h3>
                <p className="mb-4 text-xs text-[var(--y-text-dim)]">
                  Collaborator akan mendapat password default{" "}
                  <b>123456</b>
                </p>

                {/* Email */}
                <div className="mb-3 space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-[var(--y-text-mute)]">
                    Email <span className="text-[var(--y-danger)]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="afifu@gmail.com"
                    required
                    autoFocus
                    disabled={submitting}
                    className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm text-[var(--y-text)] outline-none disabled:opacity-60"
                  />
                </div>

                {/* Username */}
                <div className="mb-3 space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-[var(--y-text-mute)]">
                    Username (opsional)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Auto dari email"
                    disabled={submitting}
                    className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm text-[var(--y-text)] outline-none disabled:opacity-60"
                  />
                </div>

                {/* Role */}
                <div className="mb-4 space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-[var(--y-text-mute)]">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <RoleOption
                      active={role === "member"}
                      onClick={() => !submitting && setRole("member")}
                      icon={<Shield size={16} />}
                      label="Member"
                      desc="Upload + edit assigned doc"
                      disabled={submitting}
                    />
                    <RoleOption
                      active={role === "super_admin"}
                      onClick={() =>
                        !submitting && isOwner && setRole("super_admin")
                      }
                      icon={<ShieldCheck size={16} />}
                      label="Super Admin"
                      desc="Full workspace access"
                      disabled={!isOwner || submitting}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] text-sm font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] disabled:opacity-60"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !email}
                    className="y-gradient-brand inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <UserPlus size={15} />
                    )}
                    {submitting ? "Mengundang…" : "Undang"}
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

// =====================================================
// ROLE OPTION
// =====================================================
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
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all",
        active
          ? "border-[var(--y-primary)] bg-[rgba(99,102,241,0.1)]"
          : "border-[var(--y-border)] hover:border-[var(--y-primary)]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <div
        className={cn(
          "text-[var(--y-text-dim)]",
          active && "text-[var(--y-primary)]",
        )}
      >
        {icon}
      </div>
      <div className="text-[12px] font-bold text-[var(--y-text)]">{label}</div>
      <div className="text-[10px] leading-tight text-[var(--y-text-mute)]">
        {desc}
      </div>
    </button>
  );
}