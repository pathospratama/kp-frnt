// src/hooks/use-apply-preferences.ts
"use client";

import { useEffect } from "react";
import { useYudit } from "@/lib/yudit/store";
import { getProfile } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";

// =====================================================
// APPLY THEME
// =====================================================
export function applyTheme(theme: string): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Hapus class lama
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
  } else if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.add("light");
  }

  try {
    localStorage.setItem("yudit_theme", theme);
  } catch {
    // ignore
  }
}

// =====================================================
// APPLY LANGUAGE
// =====================================================
export function applyLanguage(language: string): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language === "en" ? "en" : "id";
  try {
    localStorage.setItem("yudit_language", language);
  } catch {
    // ignore
  }
}

// =====================================================
// HOOK
// =====================================================
/**
 * Apply theme (light/dark/system) + language ke <html> tag.
 * Dipanggil di YuditCloud setelah login berhasil.
 *
 * Flow:
 * 1. Cek localStorage dulu (instant apply, sebelum fetch)
 * 2. Fetch /profile/ untuk validasi dengan DB
 * 3. Apply theme + language
 * 4. Listen system preference change kalau theme = "system"
 */
export function useApplyPreferences(): void {
  const isAuthenticated = useYudit((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    // ⭐ 1. Instant apply dari localStorage (sebelum fetch DB)
    try {
      const cachedTheme = localStorage.getItem("yudit_theme");
      if (cachedTheme) applyTheme(cachedTheme);

      const cachedLang = localStorage.getItem("yudit_language");
      if (cachedLang) applyLanguage(cachedLang);
    } catch {
      // ignore
    }

    // ⭐ 2. Fetch dari DB untuk sinkronisasi
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        if (cancelled) return;

        applyTheme(profile.theme);
        applyLanguage(profile.language);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return;
        // Silent — jangan ganggu UX kalau fetch profile gagal
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // ⭐ 3. Listen system preference (kalau theme = "system")
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      try {
        const cachedTheme = localStorage.getItem("yudit_theme");
        if (cachedTheme === "system") {
          applyTheme("system");
        }
      } catch {
        // ignore
      }
    };

    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    }
    // Fallback old Safari
    // eslint-disable-next-line deprecation/deprecation
    mql.addListener(handleChange);
    // eslint-disable-next-line deprecation/deprecation
    return () => mql.removeListener(handleChange);
  }, []);
}
