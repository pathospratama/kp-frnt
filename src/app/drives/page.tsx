// src/app/drives/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Cloud, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// =====================================================
// REDIRECT HANDLER (dibungkus Suspense karena pakai useSearchParams)
// =====================================================
function DrivesRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    // Bangun query string untuk diteruskan ke root
    const params = new URLSearchParams();
    if (success) params.set("oauth_success", success);
    if (error) params.set("oauth_error", error);

    // Kasih delay kecil supaya user sempat lihat feedback visual
    const timer = setTimeout(() => {
      const query = params.toString();
      router.replace(query ? `/?${query}` : "/");
    }, 800);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  const success = searchParams.get("success");
  const error = searchParams.get("error");

  // ---- STATE: SUCCESS ----
  if (success) {
    return (
      <Shell>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
          className="mb-5 grid h-16 w-16 place-items-center rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(34,211,238,0.15))",
            boxShadow: "0 8px 32px rgba(16,185,129,0.35)",
          }}
        >
          <CheckCircle2 size={32} className="text-[var(--y-success)]" />
        </motion.div>
        <h1 className="mb-2 text-lg font-bold text-[var(--y-text)]">
          Berhasil Terhubung
        </h1>
        <p className="mb-6 text-sm text-[var(--y-text-dim)]">
          Akun Google Drive kamu sudah ditambahkan ke storage pool.
        </p>
        <Loading text="Mengalihkan…" />
      </Shell>
    );
  }

  // ---- STATE: ERROR ----
  if (error) {
    const errorMessages: Record<string, string> = {
      max_accounts: "Batas maksimal akun sudah tercapai.",
      duplicate_account: "Akun Google Drive ini sudah pernah terhubung.",
      no_refresh_token:
        "Google tidak mengirim refresh token. Coba hapus akses aplikasi di pengaturan Google lalu connect ulang.",
      invalid_state: "Sesi OAuth tidak valid. Coba lagi dari awal.",
    };

    return (
      <Shell>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
          className="mb-5 grid h-16 w-16 place-items-center rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.15))",
            boxShadow: "0 8px 32px rgba(239,68,68,0.35)",
          }}
        >
          <AlertCircle size={32} className="text-[var(--y-danger)]" />
        </motion.div>
        <h1 className="mb-2 text-lg font-bold text-[var(--y-text)]">
          Gagal Menghubungkan
        </h1>
        <p className="mb-6 max-w-sm text-sm text-[var(--y-text-dim)]">
          {errorMessages[error] || `Terjadi kesalahan: ${error}`}
        </p>
        <Loading text="Mengalihkan…" />
      </Shell>
    );
  }

  // ---- STATE: DEFAULT ----
  return (
    <Shell>
      <Loading text="Memuat…" />
    </Shell>
  );
}

// =====================================================
// SHELL WRAPPER
// =====================================================
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="yudit-ambient grid min-h-screen place-items-center p-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="y-glass-strong y-glow-soft w-full max-w-md rounded-3xl border border-[var(--y-border)] p-8 text-center"
      >
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="y-gradient-brand y-glow-primary grid h-9 w-9 place-items-center rounded-xl">
            <Cloud size={20} className="text-white" fill="currentColor" />
          </div>
          <div className="text-[18px] font-bold tracking-tight text-[var(--y-text)]">
            Yudit<span className="y-gradient-text">Cloud</span>
          </div>
        </div>

        {children}
      </motion.div>
    </div>
  );
}

// =====================================================
// LOADING SPINNER
// =====================================================
function Loading({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-[var(--y-text-mute)]">
      <Loader2 size={14} className="animate-spin" />
      <span>{text}</span>
    </div>
  );
}

// =====================================================
// PAGE EXPORT (dengan Suspense boundary)
// =====================================================
export default function DrivesPage() {
  return (
    <Suspense
      fallback={
        <div className="yudit-ambient grid min-h-screen place-items-center p-5">
          <Loader2 size={28} className="animate-spin text-[var(--y-primary)]" />
        </div>
      }
    >
      <DrivesRedirectContent />
    </Suspense>
  );
}