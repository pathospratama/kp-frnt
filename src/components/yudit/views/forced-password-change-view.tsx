// src/components/yudit/views/forced-password-change-view.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Lock, ShieldAlert, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ForcedPasswordChangeView() {
  const user = useYudit((s) => s.user);
  const changePassword = useYudit((s) => s.changePassword);
  const logout = useYudit((s) => s.logout);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) return toast.error("Masukkan password saat ini");
    if (newPassword.length < 6) return toast.error("Password baru minimal 6 karakter");
    if (newPassword !== confirmPassword) return toast.error("Konfirmasi tidak cocok");
    if (newPassword === currentPassword) return toast.error("Password baru tidak boleh sama dengan lama");

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      // Store sudah update user.must_change_password = false → YuditCloud auto rerender
    } catch (e: any) {
      toast.error(e?.detail || "Gagal ganti password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="yudit-ambient relative grid min-h-screen place-items-center overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--y-warn), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--y-primary), transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="y-glass-strong y-glow-soft relative z-10 w-full max-w-[440px] rounded-3xl border border-[var(--y-border)] p-8"
      >
        <div className="mb-6 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--y-warn)]"
            style={{ boxShadow: "0 8px 32px rgba(245,158,11,0.35)" }}
          >
            <KeyRound size={32} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[var(--y-text)]">Ganti Password</h1>
          <p className="mt-1.5 text-center text-[13px] text-[var(--y-text-dim)]">
            Halo <b>{user?.username}</b>, Anda masih memakai password default.
            <br />Demi keamanan, wajib ganti password sekarang.
          </p>
        </div>

        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] p-3">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-[var(--y-warn)]" />
          <div className="text-[12px] leading-relaxed text-[var(--y-warn)]">
            <b>Wajib ganti password.</b> Anda tidak bisa mengakses dashboard
            sampai password berhasil diubah.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            label="Password Saat Ini"
            placeholder="Password default: 123456"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoFocus
          />
          <PasswordField
            label="Password Baru"
            placeholder="Minimal 6 karakter"
            value={newPassword}
            onChange={setNewPassword}
          />
          <PasswordField
            label="Konfirmasi Password Baru"
            placeholder="Ulangi password baru"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "y-gradient-brand y-glow-primary group flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all",
              "hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0",
            )}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>Simpan Password Baru</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full text-center text-xs text-[var(--y-text-mute)] hover:text-[var(--y-danger)]"
          >
            Logout
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function PasswordField({
  label, placeholder, value, onChange, autoFocus,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[var(--y-text-dim)]">
        {label}
      </label>
      <div className="group relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] group-focus-within:text-[var(--y-primary)]">
          <Lock size={16} />
        </div>
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoFocus={autoFocus}
          minLength={6}
          className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] pl-10 pr-11 text-sm text-[var(--y-text)] placeholder:text-[var(--y-text-mute)]"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] hover:text-[var(--y-text)]"
          tabIndex={-1}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}