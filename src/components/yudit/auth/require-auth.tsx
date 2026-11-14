// src/components/yudit/auth/require-auth.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useYudit, isOwner } from "@/lib/yudit/store";

interface RequireAuthProps {
  children: React.ReactNode;
  /** Jika true, hanya role owner yang boleh masuk */
  requireOwner?: boolean;
  /** Redirect jika tidak berhak */
  redirectTo?: string;
}

/**
 * Guard untuk halaman private yang dibuka langsung via URL,
 * misalnya /transfer dan /scan.
 *
 * Kenapa perlu?
 * - Zustand store tidak mem-persist isAuthenticated/user.
 * - bootstrapAuth() hanya dipanggil di YuditCloud root.
 * - Tanpa guard ini, halaman seperti /transfer akan melihat user=null
 *   lalu langsung redirect sebelum auth di-load.
 */
export function RequireAuth({
  children,
  requireOwner = false,
  redirectTo = "/",
}: RequireAuthProps) {
  const router = useRouter();

  const bootstrapAuth = useYudit((s) => s.bootstrapAuth);
  const isAuthenticated = useYudit((s) => s.isAuthenticated);
  const user = useYudit((s) => s.user);

  const [ready, setReady] = useState(false);

  // Bootstrap auth dari localStorage SEBELUM guard dievaluasi
  useEffect(() => {
    bootstrapAuth();
    setReady(true);
  }, [bootstrapAuth]);

  const ownerOk = !requireOwner || isOwner(user);

  useEffect(() => {
    if (!ready) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (!ownerOk) {
      router.replace(redirectTo);
    }
  }, [ready, isAuthenticated, ownerOk, router, redirectTo]);

  if (!ready || !isAuthenticated || !ownerOk) {
    return (
      <div className="yudit-ambient grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-sm text-[var(--y-text-dim)]">
          <Loader2
            size={22}
            className="animate-spin text-[var(--y-primary)]"
          />
          Memeriksa sesi…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}