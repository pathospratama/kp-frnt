// src/hooks/use-apply-preferences.ts
"use client";

import { useEffect } from "react";
import { useYudit } from "@/lib/yudit/store";
import { getProfile } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";

// =====================================================
// CONSTANTS
// =====================================================
const THEME_KEY = "yudit_theme";
const LANGUAGE_KEY = "yudit_language";

const VALID_THEMES = ["light", "dark", "system"] as const;
type ThemeType = (typeof VALID_THEMES)[number];

// =====================================================
// VALIDATE THEME
// =====================================================
function isValidTheme(value: unknown): value is ThemeType {
  return (
    typeof value === "string" &&
    (VALID_THEMES as readonly string[]).includes(value)
  );
}

/**
 * Resolve theme "system" → "light" | "dark" berdasarkan preferensi OS.
 */
function resolveTheme(theme: ThemeType): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

// =====================================================
// APPLY THEME
// =====================================================
/**
 * Terapkan theme ke <html>.
 *
 * - Menghapus class `light` & `dark` lama
 * - Menambahkan class baru sesuai theme
 * - Set `color-scheme` CSS untuk form native elements
 * - Simpan ke localStorage
 * - Trigger event global `yudit:theme-changed` agar komponen lain bisa react
 */
export function applyTheme(theme: string): void {
  if (typeof document === "undefined") return;

  // ⭐ Validasi — kalau tidak valid, fallback ke "system"
  const safeTheme: ThemeType = isValidTheme(theme) ? theme : "system";
  const resolved = resolveTheme(safeTheme);

  const root = document.documentElement;

  // ⭐ Enable smooth transition (matikan setelah 300ms)
  root.classList.add("theme-transition");
  window.setTimeout(() => {
    root.classList.remove("theme-transition");
  }, 300);

  // Hapus class lama
  root.classList.remove("light", "dark");
  // Tambah class baru
  root.classList.add(resolved);
  // ⭐ Set color-scheme — PENTING untuk form, scrollbar, autofill
  root.style.colorScheme = resolved;

  // Simpan preferensi (bukan yang resolved, tapi yang dipilih user)
  try {
    localStorage.setItem(THEME_KEY, safeTheme);
  } catch {
    // ignore
  }

  // ⭐ Broadcast ke komponen lain (toast, chart, dll)
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("yudit:theme-changed", {
        detail: { theme: safeTheme, resolved },
      }),
    );
  }
}

// =====================================================
// APPLY LANGUAGE
// =====================================================
/**
 * Terapkan bahasa ke <html lang>.
 * Saat ini hanya mendukung "id" (Indonesia).
 */
export function applyLanguage(language: string): void {
  if (typeof document === "undefined") return;

  const safeLang = language === "en" ? "en" : "id";
  document.documentElement.lang = safeLang;

  try {
    localStorage.setItem(LANGUAGE_KEY, safeLang);
  } catch {
    // ignore
  }
}

// =====================================================
// GET CURRENT THEME
// =====================================================
/**
 * Baca theme saat ini dari localStorage.
 * Return "system" kalau tidak ada / invalid.
 */
export function getCurrentTheme(): ThemeType {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isValidTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

// =====================================================
// HOOK — apply preferences saat login
// =====================================================
/**
 * Apply theme (light/dark/system) + language ke <html> tag.
 *
 * Dipanggil di YuditCloud setelah login berhasil.
 *
 * Flow:
 * 1. Instant apply dari localStorage (untuk theme & language)
 * 2. Fetch /profile/ untuk sinkronisasi dengan DB
 * 3. Kalau beda → apply theme baru
 * 4. Listen system preference change kalau theme = "system"
 */
export function useApplyPreferences(): void {
  const isAuthenticated = useYudit((s) => s.isAuthenticated);

  // ---- Instant apply dari localStorage ----
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cachedTheme = localStorage.getItem(THEME_KEY);
      if (cachedTheme) applyTheme(cachedTheme);

      const cachedLang = localStorage.getItem(LANGUAGE_KEY);
      if (cachedLang) applyLanguage(cachedLang);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  // ---- Sync dengan DB setelah login ----
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        if (cancelled) return;

        // ⭐ Validasi + apply
        const dbTheme = isValidTheme(profile.theme)
          ? profile.theme
          : "system";

        // Hanya apply kalau BEDA dengan localStorage (hindari flicker)
        const cachedTheme = getCurrentTheme();
        if (dbTheme !== cachedTheme) {
          applyTheme(dbTheme);
        }

        // Language — hardcode "id" karena app hanya Indonesia
        applyLanguage("id");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return;
        // Silent — jangan ganggu UX kalau fetch profile gagal
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // ---- Listen system preference change ----
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      try {
        const cachedTheme = localStorage.getItem(THEME_KEY);
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
