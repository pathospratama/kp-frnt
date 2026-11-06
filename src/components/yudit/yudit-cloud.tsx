// src/components/yudit/yudit-cloud.tsx
"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

import { ForcedPasswordChangeView } from "./views/forced-password-change-view";
import {
  registerToast,
  useYudit,
  canAccessView,
  defaultViewForRole,
  canManageWorkspace,
} from "@/lib/yudit/store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { LoginView } from "./views/login-view";
import { FilesView } from "./views/files-view";
import { MonthlyView } from "./views/monthly-view";
import { StatsView } from "./views/stats-view";
import { DrivesView } from "./views/drives-view";
import { ConvertView } from "./views/convert-view";
import { CollaboratorsView } from "./views/collaborators-view";
import { MyTasksView } from "./views/my-tasks-view";
import { PreviewModal } from "./modals/preview-modal";
import { ShareModal } from "./modals/share-modal";
import { CategoryManagerModal } from "./modals/category-manager-modal";
import { AssignDocumentModal } from "./modals/assign-document-modal";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { ProgressOverlay } from "./ui/progress-overlay";
import { DocEditor } from "./editor/doc-editor";
import { GoogleDocViewer } from "./editor/google-doc-viewer";
import { DocPreviewViewer } from "./editor/doc-preview-viewer";

// =====================================================
// ASSIGN MODAL WRAPPER
// =====================================================
function AssignModalWrapper() {
  const open = useYudit((s) => s.assignModalOpen);
  const fileId = useYudit((s) => s.assignModalFileId);
  const files = useYudit((s) => s.files);
  const close = useYudit((s) => s.closeAssignModal);

  const file = useMemo(
    () => files.find((f) => f.id === fileId),
    [files, fileId],
  );

  if (!open || !fileId || !file) return null;

  return (
    <AssignDocumentModal
      open={open}
      fileId={fileId}
      fileName={file.name}
      onClose={close}
    />
  );
}

// =====================================================
// EDITOR MOUNT
// =====================================================
function EditorMount() {
  const editorState = useYudit((s) => s.editorState);
  const closeEditor = useYudit((s) => s.closeEditor);
  const files = useYudit((s) => s.files);
  const fetchFiles = useYudit((s) => s.fetchFiles);

  const file = useMemo(
    () => (editorState ? files.find((f) => f.id === editorState.fileId) : null),
    [files, editorState],
  );

  if (!editorState || !file) return null;

  const handleClose = () => {
    closeEditor();
    fetchFiles();
  };

  if (editorState.mode === "local") {
    return (
      <DocEditor fileId={file.id} fileName={file.name} onClose={handleClose} />
    );
  }
  if (editorState.mode === "google_docs") {
    return (
      <GoogleDocViewer
        fileId={file.id}
        fileName={file.name}
        existingDocId={file.google_doc_id}
        onClose={handleClose}
      />
    );
  }
  if (editorState.mode === "preview") {
    return (
      <DocPreviewViewer
        fileId={file.id}
        fileName={file.name}
        onClose={handleClose}
      />
    );
  }
  return null;
}

// =====================================================
// DRIVE AUTH BANNER
// =====================================================
function DriveAuthBanner() {
  const err = useYudit((s) => s.driveAuthError);
  const clearErr = useYudit((s) => s.clearDriveAuthError);
  const setView = useYudit((s) => s.setView);
  const currentView = useYudit((s) => s.currentView);
  const user = useYudit((s) => s.user);

  if (!err.email && !err.message) return null;
  if (!canManageWorkspace(user)) return null;
  if (currentView === "drives") return null;

  const displayName = err.email || "Google Drive";

  return (
    <AnimatePresence>
      <motion.div
        key="drive-auth-banner"
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-4 overflow-hidden"
      >
        <div className="flex items-start gap-3 rounded-2xl border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] p-4 shadow-[0_4px_16px_rgba(245,158,11,0.08)]">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(245,158,11,0.18)]">
            <AlertTriangle size={16} className="text-[var(--y-warn)]" />
          </div>
          <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-[var(--y-text-dim)]">
            <div className="mb-0.5 font-semibold text-[var(--y-text)]">
              Google Drive Perlu Reconnect
            </div>
            <div className="break-words">
              <b className="text-[var(--y-warn)]">{displayName}</b> sudah tidak
              valid (token revoked). File yang tersimpan di drive ini tidak bisa
              diakses sampai Anda reconnect.
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setView("drives")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--y-warn)] px-3 text-[12px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#d97706]"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Buka Drives</span>
              <span className="sm:hidden">Drives</span>
            </button>
            <button
              type="button"
              onClick={clearErr}
              title="Tutup"
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--y-text-mute)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// =====================================================
// VIEW ROUTER
// =====================================================
function ViewRouter({ view }: { view: string }) {
  switch (view) {
    case "files":
      return <FilesView />;
    case "my-tasks":
      return <MyTasksView />;
    case "convert":
      return <ConvertView />;
    case "monthly":
      return <MonthlyView />;
    case "stats":
      return <StatsView />;
    case "drives":
      return <DrivesView />;
    case "collaborators":
      return <CollaboratorsView />;
    default:
      return <FilesView />;
  }
}

// =====================================================
// MAIN COMPONENT
// =====================================================
export function YuditCloud() {
  const isAuthenticated = useYudit((s) => s.isAuthenticated);
  const user = useYudit((s) => s.user);
  const currentView = useYudit((s) => s.currentView);
  const setView = useYudit((s) => s.setView);
  const bootstrapAuth = useYudit((s) => s.bootstrapAuth);
  const fetchFiles = useYudit((s) => s.fetchFiles);
  const fetchDrives = useYudit((s) => s.fetchDrives);
  const fetchCategories = useYudit((s) => s.fetchCategories);
  const fetchCollaborators = useYudit((s) => s.fetchCollaborators);
  const fetchConversionOperations = useYudit(
    (s) => s.fetchConversionOperations,
  );
  const fetchConversionJobs = useYudit((s) => s.fetchConversionJobs);

  useEffect(() => {
    registerToast((msg, type) => {
      if (type === "success") toast.success(msg);
      else if (type === "error") toast.error(msg);
      else toast(msg);
    });
  }, []);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get("oauth_success");
    const oauthError = params.get("oauth_error");

    if (!oauthSuccess && !oauthError) return;

    if (!canManageWorkspace(user)) {
      window.history.replaceState({}, "", "/");
      return;
    }

    setView("drives");

    if (oauthSuccess === "connected") {
      toast.success("Google Drive berhasil dihubungkan!");
    } else if (oauthError) {
      const errorMessages: Record<string, string> = {
        max_accounts: "Batas maksimal akun tercapai",
        duplicate_account: "Akun Google Drive sudah terhubung",
        no_refresh_token:
          "Google tidak mengirim refresh token. Coba connect ulang.",
        invalid_state: "Sesi OAuth tidak valid",
        forbidden:
          "Hanya owner atau super admin yang bisa connect Google Drive.",
        user_not_found: "User tidak ditemukan",
        inactive_user: "Akun Anda dinonaktifkan",
        exchange_failed: "Gagal menukar kode OAuth. Coba lagi.",
        userinfo_failed: "Gagal mengambil info user dari Google. Coba lagi.",
        save_failed: "Gagal menyimpan akun Drive. Coba lagi.",
      };
      toast.error(errorMessages[oauthError] || `Gagal connect: ${oauthError}`);
    }

    fetchDrives();
    window.history.replaceState({}, "", "/");
  }, [isAuthenticated, user, setView, fetchDrives]);

  // ⭐ FETCH DATA untuk SEMUA role (member = read-only)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const targetView = canAccessView(user, currentView)
      ? currentView
      : defaultViewForRole(user);

    if (targetView !== currentView) {
      setView(targetView);
      return;
    }

    const filesViews = ["files", "my-tasks", "monthly", "stats", "convert"];
    if (filesViews.includes(currentView)) {
      fetchFiles();
    }

    if (currentView === "convert") {
      fetchConversionOperations();
      fetchConversionJobs();
    }

    // ⭐ Fetch drives & collaborators untuk semua role
    // (member butuh data ini untuk sidebar badge & read-only views)
    fetchDrives();
    fetchCollaborators();
    fetchCategories();
  }, [
    isAuthenticated,
    user,
    currentView,
    setView,
    fetchFiles,
    fetchDrives,
    fetchCategories,
    fetchCollaborators,
    fetchConversionOperations,
    fetchConversionJobs,
  ]);

  if (isAuthenticated && user?.must_change_password) {
    return (
      <div className="min-h-screen">
        <ForcedPasswordChangeView />
        <ConfirmDialog />
        <ProgressOverlay />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <LoginView />
        <ConfirmDialog />
        <ProgressOverlay />
      </div>
    );
  }

  return (
    <div className="yudit-ambient relative flex min-h-screen flex-col">
      <div className="relative z-10 flex min-h-screen flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <main className="flex-1 overflow-y-auto">
            <div className="y-container py-4 sm:py-6 lg:py-8">
              <DriveAuthBanner />

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <ViewRouter view={currentView} />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      <PreviewModal />
      <ShareModal />
      <CategoryManagerModal />
      <AssignModalWrapper />
      <ConfirmDialog />
      <ProgressOverlay />
      <EditorMount />
    </div>
  );
}
