// src/components/yudit/auth/require-auth.tsx
"use client";

import { useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useYudit, isOwner, defaultViewForRole } from "@/lib/yudit/store";

interface RequireAuthProps {
  children: React.ReactNode;
  /** Jika true, hanya role owner yang boleh masuk */
  requireOwner?: boolean;
  /** Redirect jika belum login */
  redirectTo?: string;
}

/**
 * Guard untuk halaman private yang dibuka langsung via URL (/scan, /transfer).
 *
 * Kenapa versi lama bug (redirect ke /?view=files):
 * - Zustand TIDAK persist isAuthenticated/user, jadi saat page load
 *   isAuthenticated=false sampai bootstrapAuth() selesai.
 * - useEffect [ready, isAuthenticated] membaca isAuthenticated dari
 *   closure lama (false) → router.replace("/") padahal sesi VALID.
 *
 * Perbaikan:
 * - isAuthenticated & user DIPERSIST di localStorage (lihat store.ts).
 * - Zustand hydration selesai SEBELUM render pertama → isAuthenticated
 *   sudah benar di render pertama.
 * - bootstrapAuth() dipanggil di useLayoutEffect (sync) untuk catch
 *   perubahan terbaru dari token (misal token dihapus di tab lain).
 * - Redirect baru dilakukan setelah bootstrapped=true.
 */
export function RequireAuth({
  children,
  requireOwner = false,
  redirectTo,
}: RequireAuthProps) {
  const router = useRouter();

  const isAuthenticated = useYudit((s) => s.isAuthenticated);
  const user = useYudit((s) => s.user);
  const bootstrapped = useYudit((s) => s.bootstrapped);
  const bootstrapAuth = useYudit((s) => s.bootstrapAuth);

  // ⭐ Bootstrap SEBELUM paint (useLayoutEffect) — hindari race
  useLayoutEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  const ownerOk = !requireOwner || isOwner(user);
  const finalRedirect = redirectTo || "/";

  useEffect(() => {
    // ⭐ Tunggu bootstrapped benar-benar selesai
    if (!bootstrapped) return;

    if (!isAuthenticated) {
      router.replace(finalRedirect);
      return;
    }

    if (!ownerOk) {
      // Redirect ke default view untuk role user (bukan paksa /)
      const targetView = defaultViewForRole(user);
      const targetUrl =
        finalRedirect && finalRedirect !== "/"
          ? finalRedirect
          : `/?view=${targetView}`;
      router.replace(targetUrl);
    }
  }, [bootstrapped, isAuthenticated, ownerOk, user, router, finalRedirect]);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  // Loading: tunggu Zustand hydration + bootstrapAuth
  if (!bootstrapped) {
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

  // Belum login → tunggu redirect
  if (!isAuthenticated) {
    return (
      <div className="yudit-ambient grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-sm text-[var(--y-text-dim)]">
          <Loader2
            size={22}
            className="animate-spin text-[var(--y-primary)]"
          />
          Mengarahkan…
        </div>
      </div>
    );
  }

  // Login tapi tidak berhak (misal member buka /transfer)
  if (!ownerOk) {
    return (
      <div className="yudit-ambient grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-sm text-[var(--y-text-dim)]">
          <Loader2
            size={22}
            className="animate-spin text-[var(--y-primary)]"
          />
          Mengarahkan…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}// src/components/yudit/auth/require-auth.tsx
"use client";

import { useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useYudit, isOwner, defaultViewForRole } from "@/lib/yudit/store";

interface RequireAuthProps {
  children: React.ReactNode;
  /** Jika true, hanya role owner yang boleh masuk */
  requireOwner?: boolean;
  /** Redirect jika belum login */
  redirectTo?: string;
}

/**
 * Guard untuk halaman private yang dibuka langsung via URL (/scan, /transfer).
 *
 * Kenapa versi lama bug (redirect ke /?view=files):
 * - Zustand TIDAK persist isAuthenticated/user, jadi saat page load
 *   isAuthenticated=false sampai bootstrapAuth() selesai.
 * - useEffect [ready, isAuthenticated] membaca isAuthenticated dari
 *   closure lama (false) → router.replace("/") padahal sesi VALID.
 *
 * Perbaikan:
 * - isAuthenticated & user DIPERSIST di localStorage (lihat store.ts).
 * - Zustand hydration selesai SEBELUM render pertama → isAuthenticated
 *   sudah benar di render pertama.
 * - bootstrapAuth() dipanggil di useLayoutEffect (sync) untuk catch
 *   perubahan terbaru dari token (misal token dihapus di tab lain).
 * - Redirect baru dilakukan setelah bootstrapped=true.
 */
export function RequireAuth({
  children,
  requireOwner = false,
  redirectTo,
}: RequireAuthProps) {
  const router = useRouter();

  const isAuthenticated = useYudit((s) => s.isAuthenticated);
  const user = useYudit((s) => s.user);
  const bootstrapped = useYudit((s) => s.bootstrapped);
  const bootstrapAuth = useYudit((s) => s.bootstrapAuth);

  // ⭐ Bootstrap SEBELUM paint (useLayoutEffect) — hindari race
  useLayoutEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  const ownerOk = !requireOwner || isOwner(user);
  const finalRedirect = redirectTo || "/";

  useEffect(() => {
    // ⭐ Tunggu bootstrapped benar-benar selesai
    if (!bootstrapped) return;

    if (!isAuthenticated) {
      router.replace(finalRedirect);
      return;
    }

    if (!ownerOk) {
      // Redirect ke default view untuk role user (bukan paksa /)
      const targetView = defaultViewForRole(user);
      const targetUrl =
        finalRedirect && finalRedirect !== "/"
          ? finalRedirect
          : `/?view=${targetView}`;
      router.replace(targetUrl);
    }
  }, [bootstrapped, isAuthenticated, ownerOk, user, router, finalRedirect]);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  // Loading: tunggu Zustand hydration + bootstrapAuth
  if (!bootstrapped) {
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

  // Belum login → tunggu redirect
  if (!isAuthenticated) {
    return (
      <div className="yudit-ambient grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-sm text-[var(--y-text-dim)]">
          <Loader2
            size={22}
            className="animate-spin text-[var(--y-primary)]"
          />
          Mengarahkan…
        </div>
      </div>
    );
  }

  // Login tapi tidak berhak (misal member buka /transfer)
  if (!ownerOk) {
    return (
      <div className="yudit-ambient grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-sm text-[var(--y-text-dim)]">
          <Loader2
            size={22}
            className="animate-spin text-[var(--y-primary)]"
          />
          Mengarahkan…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
