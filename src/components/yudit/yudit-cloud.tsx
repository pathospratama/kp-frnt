// src/components/yudit/yudit-cloud.tsx
"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { registerToast, useYudit } from "@/lib/yudit/store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { LoginView } from "./views/login-view";
import { ArsipView } from "@/components/arsip/arsip-view";
import { RingkasanView } from "@/components/arsip/ringkasan-view";
import { UnggahView } from "@/components/arsip/unggah-view";
import { AktivitasView } from "@/components/arsip/aktivitas-view";
import { ProfilView } from "@/components/arsip/profil-view";
import { MonthlyView } from "./views/monthly-view";
import { DrivesView } from "./views/drives-view";
import { PreviewModal } from "./modals/preview-modal";
import { ShareModal } from "./modals/share-modal";
import { CategoryManagerModal } from "./modals/category-manager-modal";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { ProgressOverlay } from "./ui/progress-overlay";

export function YuditCloud() {
  const isAuthenticated = useYudit((s) => s.isAuthenticated);
  const currentView = useYudit((s) => s.currentView);
  const role = useYudit((s) => s.role);
  const arsipTab = useYudit((s) => s.arsipTab);
  const setArsipTab = useYudit((s) => s.setArsipTab);
  const setView = useYudit((s) => s.setView);
  const bootstrapAuth = useYudit((s) => s.bootstrapAuth);
  const fetchFiles = useYudit((s) => s.fetchFiles);
  const fetchDrives = useYudit((s) => s.fetchDrives);
  const fetchCategories = useYudit((s) => s.fetchCategories);

  // Toast bridge: store -> sonner
  useEffect(() => {
    registerToast((msg, type) => {
      if (type === "success") toast.success(msg);
      else if (type === "error") toast.error(msg);
      else toast(msg);
    });
  }, []);

  // Bootstrap auth dari localStorage
  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  // OAuth callback query params (dari /drives redirect)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get("oauth_success");
    const oauthError = params.get("oauth_error");

    if (!oauthSuccess && !oauthError) return;

    setView("penyimpanan");

    if (oauthSuccess === "connected") {
      toast.success("Google Drive berhasil dihubungkan.");
    } else if (oauthError) {
      const errorMessages: Record<string, string> = {
        max_accounts: "Batas maksimal akun tercapai.",
        duplicate_account: "Akun Google Drive sudah terhubung.",
        no_refresh_token: "Google tidak mengirim refresh token. Coba hubungkan ulang.",
        invalid_state: "Sesi OAuth tidak valid.",
      };
      toast.error(errorMessages[oauthError] || `Gagal menghubungkan: ${oauthError}`);
    }

    fetchDrives();
    window.history.replaceState({}, "", "/");
  }, [setView, fetchDrives]);

  // Initial fetch setelah auth
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchFiles();
    fetchDrives();
    fetchCategories();
  }, [isAuthenticated, fetchFiles, fetchDrives, fetchCategories]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <LoginView />
        <ConfirmDialog />
        <ProgressOverlay />
      </div>
    );
  }

  const isAdmin = role === "admin";

  return (
    <div className="yudit-ambient relative flex min-h-screen flex-col">
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[var(--y-primary)] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Lewati ke konten utama
      </a>
      <div className="relative z-10 flex min-h-screen flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main id="konten-utama" className="flex-1 overflow-y-auto p-4 sm:p-6" tabIndex={-1}>
            <div className="mx-auto max-w-6xl">
              {currentView === "arsip" && (
                <>
                  {isAdmin && (
                    <div className="mb-4 inline-flex rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-1" role="tablist" aria-label="Tampilan arsip">
                      {(["daftar", "bulanan"] as const).map((t) => (
                        <button
                          key={t}
                          role="tab"
                          aria-selected={arsipTab === t}
                          onClick={() => setArsipTab(t)}
                          className={
                            arsipTab === t
                              ? "h-8 rounded-md bg-[var(--y-primary)] px-4 text-[13px] font-medium text-white"
                              : "h-8 rounded-md px-4 text-[13px] font-medium text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
                          }
                        >
                          {t === "daftar" ? "Daftar" : "Per bulan"}
                        </button>
                      ))}
                    </div>
                  )}
                  {arsipTab === "bulanan" && isAdmin ? <MonthlyView /> : <ArsipView admin={isAdmin} />}
                </>
              )}
              {currentView === "ringkasan" && (isAdmin ? <RingkasanView /> : <ArsipView />)}
              {currentView === "unggah" && (isAdmin ? <UnggahView /> : <ArsipView />)}
              {currentView === "aktivitas" && (isAdmin ? <AktivitasView /> : <ArsipView />)}
              {currentView === "penyimpanan" && (isAdmin ? <DrivesView /> : <ArsipView />)}
              {currentView === "profil" && <ProfilView />}
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
