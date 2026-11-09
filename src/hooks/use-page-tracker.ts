// src/hooks/use-page-tracker.ts
"use client";

import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/api/profile";
import { useYudit } from "@/lib/yudit/store";

const PAGE_TITLES: Record<string, string> = {
  files: "My Files",
  "my-tasks": "Dokumen Saya",
  convert: "Konversi Dokumen",
  monthly: "Arsip Per Bulan",
  stats: "Statistik",
  drives: "Google Drive Accounts",
  collaborators: "Collaborators",
  profile: "Profil Saya",
};

/**
 * Hook untuk auto-track page views.
 * Panggil di komponen utama (yudit-cloud.tsx) dengan currentView.
 * Track setiap kali view berubah → catat ke backend.
 */
export function usePageTracker() {
  const isAuthenticated = useYudit((s) => s.isAuthenticated);
  const currentView = useYudit((s) => s.currentView);
  const userId = useYudit((s) => s.user?.id);
  const lastTrackedRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    // Hitung duration di view sebelumnya
    const prevView = lastTrackedRef.current;
    const now = Date.now();
    const durationMs = prevView ? now - startTimeRef.current : 0;

    // Skip kalau masih di view yang sama (hindari duplicate)
    if (prevView === currentView) return;

    const pagePath = `/?view=${currentView}`;
    const pageTitle = PAGE_TITLES[currentView] || currentView;

    // Track page view
    trackPageView({
      page_path: pagePath,
      page_title: pageTitle,
      referrer: prevView
        ? `/?view=${prevView}`
        : typeof document !== "undefined"
          ? document.referrer
          : undefined,
      duration_ms: durationMs > 0 ? durationMs : undefined,
    }).catch(() => {
      // Silent — tracking tidak boleh ganggu UX
    });

    lastTrackedRef.current = currentView;
    startTimeRef.current = now;
  }, [isAuthenticated, userId, currentView]);
}
