// src/components/yudit/yudit-cloud.tsx
"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { registerToast, useYudit } from "@/lib/yudit/store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { LoginView } from "./views/login-view";
import { FilesView } from "./views/files-view";
import { MonthlyView } from "./views/monthly-view";
import { StatsView } from "./views/stats-view";
import { DrivesView } from "./views/drives-view";
import { PreviewModal } from "./modals/preview-modal";
import { ShareModal } from "./modals/share-modal";
import { CategoryManagerModal } from "./modals/category-manager-modal";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { ProgressOverlay } from "./ui/progress-overlay";

export function YuditCloud() {
  const isAuthenticated = useYudit((s) => s.isAuthenticated);
  const currentView = useYudit((s) => s.currentView);
  const setView = useYudit((s) => s.setView);
  const bootstrapAuth = useYudit((s) => s.bootstrapAuth);
  const fetchFiles = useYudit((s) => s.fetchFiles);
  const fetchDrives = useYudit((s) => s.fetchDrives);
  const fetchCategories = useYudit((s) => s.fetchCategories);

  // =====================================================
  // REGISTER TOAST BRIDGE
  // =====================================================
  useEffect(() => {
    registerToast((msg, type) => {
      if (type === "success") toast.success(msg);
      else if (type === "error") toast.error(msg);
      else toast(msg);
    });
  }, []);

  // =====================================================
  // BOOTSTRAP AUTH dari localStorage
  // =====================================================
  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  // =====================================================
  // HANDLE OAUTH CALLBACK QUERY PARAMS
  // (dari /drives redirect → /?oauth_success=... atau ?oauth_error=...)
  // =====================================================
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get("oauth_success");
    const oauthError = params.get("oauth_error");

    if (!oauthSuccess && !oauthError) return;

    // Set view ke drives supaya user langsung lihat
    setView("drives");

    // Tampilkan toast
    if (oauthSuccess === "connected") {
      toast.success("Google Drive berhasil dihubungkan!");
    } else if (oauthError) {
      const errorMessages: Record<string, string> = {
        max_accounts: "Batas maksimal akun tercapai",
        duplicate_account: "Akun Google Drive sudah terhubung",
        no_refresh_token:
          "Google tidak mengirim refresh token. Coba connect ulang.",
        invalid_state: "Sesi OAuth tidak valid",
      };
      toast.error(
        errorMessages[oauthError] || `Gagal connect: ${oauthError}`,
      );
    }

    // Refresh data drives + pool setelah OAuth
    fetchDrives();

    // Bersihkan query string dari URL (biar tidak ke-refresh berulang)
    window.history.replaceState({}, "", "/");
  }, [setView, fetchDrives]);

  // =====================================================
  // INITIAL FETCH setelah auth
  // =====================================================
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchFiles();
    fetchDrives();
    fetchCategories();
  }, [isAuthenticated, fetchFiles, fetchDrives, fetchCategories]);

  // =====================================================
  // RENDER: LOGIN PAGE
  // =====================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <LoginView />
        <ConfirmDialog />
        <ProgressOverlay />
      </div>
    );
  }

  // =====================================================
  // RENDER: MAIN APP
  // =====================================================
  return (
    <div className="yudit-ambient relative flex min-h-screen flex-col">
      <div className="relative z-10 flex min-h-screen flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-6xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentView === "files" && <FilesView />}
                  {currentView === "monthly" && <MonthlyView />}
                  {currentView === "stats" && <StatsView />}
                  {currentView === "drives" && <DrivesView />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      <PreviewModal />
      <ShareModal />
      <CategoryManagerModal />
      <ConfirmDialog />
      <ProgressOverlay />
    </div>
  );
}