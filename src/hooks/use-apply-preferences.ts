// src/hooks/use-apply-preferences.ts
"use client";

import { useEffect } from "react";
import { useYudit } from "@/lib/yudit/store";
import { getProfile } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";

const THEME_KEY = "yudit_theme";
const LANGUAGE_KEY = "yudit_language";

const VALID_THEMES = ["light", "dark", "system"] as const;
type ThemeType = (typeof VALID_THEMES)[number];

function isValidTheme(value: unknown): value is ThemeType {
  return (
    typeof value === "string" &&
    (VALID_THEMES as readonly string[]).includes(value)
  );
}

function resolveTheme(theme: ThemeType): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

/**
 * Terapkan theme ke <html>.
 * - Hapus class lama, tambah class baru
 * - Set color-scheme
 * - Simpan ke localStorage
 * - Broadcast event
 */
export function applyTheme(theme: string): void {
  if (typeof document === "undefined") return;

  const safeTheme: ThemeType = isValidTheme(theme) ? theme : "system";
  const resolved = resolveTheme(safeTheme);

  const root = document.documentElement;

  // smooth transition 0.2s
  root.classList.add("theme-transition");
  window.setTimeout(() => {
    root.classList.remove("theme-transition");
  }, 300);

  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;

  try {
    localStorage.setItem(THEME_KEY, safeTheme);
  } catch {
    /* ignore */
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("yudit:theme-changed", {
        detail: { theme: safeTheme, resolved },
      }),
    );
  }
}

export function applyLanguage(language: string): void {
  if (typeof document === "undefined") return;
  const safeLang = language === "en" ? "en" : "id";
  document.documentElement.lang = safeLang;
  try {
    localStorage.setItem(LANGUAGE_KEY, safeLang);
  } catch {
    /* ignore */
  }
}

export function getCurrentTheme(): ThemeType {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isValidTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function useApplyPreferences(): void {
  const isAuthenticated = useYudit((s) => s.isAuthenticated);

  // Instant apply dari localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cachedTheme = localStorage.getItem(THEME_KEY);
      if (cachedTheme) applyTheme(cachedTheme);
      const cachedLang = localStorage.getItem(LANGUAGE_KEY);
      if (cachedLang) applyLanguage(cachedLang);
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  // Sync dengan DB setelah login
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        if (cancelled) return;

        const dbTheme = isValidTheme(profile.theme) ? profile.theme : "system";
        const cachedTheme = getCurrentTheme();
        if (dbTheme !== cachedTheme) {
          applyTheme(dbTheme);
        }
        applyLanguage("id");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Listen system preference change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      try {
        const cachedTheme = localStorage.getItem(THEME_KEY);
        if (cachedTheme === "system") applyTheme("system");
      } catch {
        /* ignore */
      }
    };
    if (mql.addEventListener) {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    }
    // @ts-expect-error old Safari
    mql.addListener(handleChange);
    // @ts-expect-error old Safari
    return () => mql.removeListener(handleChange);
  }, []);
}
