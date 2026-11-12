// src/app/reset-password/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Cloud, Lock, Loader2, CheckCircle2, AlertCircle,
  KeyRound, ArrowLeft, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";

// =====================================================
// INNER
// =====================================================
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validasi token
  useEffect(() => {
    if (!token) {
      setError(
        "Link reset tidak valid. Pastikan Anda membuka link lengkap dari email.",
      );
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      setSuccess(true);
      toast.success("Password berhasil direset!");
      // Auto-redirect ke login setelah 3 detik
      setTimeout(() => router.replace("/"), 3000);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.detail
          : "Gagal reset password. Link mungkin expired atau sudah dipakai.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Success state ----
  if (success) {
    return (
      <Shell>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[rgba(16,185,129,0.15)]"
        >
          <CheckCircle2 size={32} className="text-[#10b981]" />
        </motion.div>
        <h1 className="mb-2 text-lg font-bold text-[var(--y-text)]">
          Password Berhasil Direset
        </h1>
        <p className="mb-6 text-sm text-[var(--y-text-dim)]">
          Anda akan diarahkan ke halaman login dalam 3 detik…
        </p>
        <button
          onClick={() => router.replace("/")}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-4 text-sm font-semibold text-[var(--y-text)] hover:bg-[var(--y-bg-hover)]"
        >
          <ArrowLeft size={14} />
          Buka Halaman Login
        </button>
      </Shell>
    );
  }

  // ---- Token invalid state ----
  if (!token) {
    return (
      <Shell>
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[rgba(239,68,68,0.15)]">
          <AlertCircle size={32} className="text-[var(--y-danger)]" />
        </div>
        <h1 className="mb-2 text-lg font-bold text-[var(--y-text)]">
          Link Tidak Valid
        </h1>
        <p className="mb-6 text-sm text-[var(--y-text-dim)]">
          {error ||
            "Link reset password tidak lengkap atau sudah rusak. " +
              "Silakan minta ulang melalui halaman Cek Akun."}
        </p>
        <button
          onClick={() => router.replace("/")}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-4 text-sm font-semibold text-[var(--y-text)] hover:bg-[var(--y-bg-hover)]"
        >
          <ArrowLeft size={14} />
          Kembali ke Login
        </button>
      </Shell>
    );
  }

  // ---- Form ----
  return (
    <Shell>
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[rgba(239,68,68,0.15)]">
        <KeyRound size={32} className="text-[var(--y-primary)]" />
      </div>
      <h1 className="mb-2 text-lg font-bold text-[var(--y-text)]">
        Reset Password
      </h1>
      <p className="mb-6 text-sm text-[var(--y-text-dim)]">
        Masukkan password baru Anda. Setelah berhasil, Anda akan diarahkan
        ke halaman login.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--y-text-dim)]">
            Password Baru
          </label>
          <div className="group relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] group-focus-within:text-[var(--y-primary)]"
            />
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              minLength={8}
              required
              autoFocus
              className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] pl-10 pr-11 text-sm text-[var(--y-text)] placeholder:text-[var(--y-text-mute)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] hover:text-[var(--y-text)]"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--y-text-dim)]">
            Konfirmasi Password Baru
          </label>
          <div className="group relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] group-focus-within:text-[var(--y-primary)]"
            />
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              minLength={8}
              required
              className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] pl-10 pr-4 text-sm text-[var(--y-text)] placeholder:text-[var(--y-text-mute)]"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] p-2.5 text-xs text-[var(--y-danger)]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !newPassword || !confirmPassword}
          className="y-gradient-brand y-glow-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Menyimpan…
            </>
          ) : (
            <>
              <KeyRound size={15} />
              Simpan Password Baru
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => router.replace("/")}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-[var(--y-text-mute)] hover:text-[var(--y-text)]"
        >
          <ArrowLeft size={14} />
          Batal
        </button>
      </form>
    </Shell>
  );
}

// =====================================================
// SHELL
// =====================================================
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="yudit-ambient grid min-h-screen place-items-center p-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="y-glass-strong y-glow-soft w-full max-w-md rounded-3xl border border-[var(--y-border)] p-8 text-center"
      >
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="y-gradient-brand y-glow-primary grid h-9 w-9 place-items-center rounded-xl">
            <Cloud size={20} className="text-white" fill="currentColor" />
          </div>
          <div className="text-[18px] font-bold tracking-tight text-[var(--y-text)]">
            DPRD<span className="y-gradient-text">Cloud</span>
          </div>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// =====================================================
// PAGE
// =====================================================
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="yudit-ambient grid min-h-screen place-items-center p-5">
          <Loader2 size={28} className="animate-spin text-[var(--y-primary)]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}