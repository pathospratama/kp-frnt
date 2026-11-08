"use client";

import {
  Menu,
  FolderPlus,
  Upload,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { useYudit, canManageWorkspace } from "@/lib/yudit/store";
import type { ViewKey } from "@/lib/yudit/types";

// =====================================================
// TITLES — WAJIB lengkap untuk semua ViewKey
// =====================================================
const TITLES: Record<ViewKey, string> = {
  files: "My Files",
  monthly: "Arsip Per Bulan",
  stats: "Statistik & Analytics",
  drives: "Google Drive Accounts",
  convert: "File Conversion",
  collaborators: "Collaborators",
  "my-tasks": "Dokumen Saya",
  profile: "Profil Saya",
};

export function Topbar() {
  const currentView = useYudit((s) => s.currentView);
  const setSidebarOpen = useYudit((s) => s.setSidebarOpen);
  const setView = useYudit((s) => s.setView);
  const uploadFiles = useYudit((s) => s.uploadFiles);
  const showConfirm = useYudit((s) => s.showConfirm);
  const drives = useYudit((s) => s.drives);
  const user = useYudit((s) => s.user);

  const isManager = canManageWorkspace(user);

  // Menu Profile tidak butuh tombol Upload/New Folder
  const isProfileView = currentView === "profile";

  const triggerUpload = () => {
    if (drives.length === 0) {
      showConfirm(
        "Hubungkan Drive dulu",
        "Tambahkan akun Google Drive sebelum upload file.",
        () => useYudit.getState().setView("drives"),
      );
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = () => {
      if (input.files) uploadFiles(Array.from(input.files));
    };
    input.click();
  };

  const handleNewFolder = () => {
    showConfirm(
      "Buat folder baru?",
      "Folder khusus akan dibuat untuk mengelompokkan file.",
      () => {
        useYudit.getState().setView("files");
      },
    );
  };

  const handleOpenProfile = () => {
    setView("profile");
  };

  const initials = (user?.username || "U").charAt(0).toUpperCase();

  return (
    <header className="y-glass sticky top-0 z-30 border-b border-[var(--y-border)]">
      <div className="y-container flex h-16 items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg text-[var(--y-text-dim)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb */}
        <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <span className="hidden text-[var(--y-text-mute)] sm:inline">
            DPRD Cloud
          </span>
          <ChevronRight
            size={14}
            className="hidden text-[var(--y-text-mute)] sm:inline"
          />
          <span className="truncate font-semibold text-[var(--y-text)]">
            {TITLES[currentView] || "Dashboard"}
          </span>
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Tombol aksi hanya muncul kalau BUKAN profile view */}
          {!isProfileView && (
            <>
              <button
                onClick={handleNewFolder}
                className="hidden h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] font-semibold text-[var(--y-text)] transition-all hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] sm:inline-flex"
              >
                <FolderPlus size={15} />
                <span className="hidden md:inline">New Folder</span>
              </button>
              <button
                onClick={triggerUpload}
                className="y-gradient-brand y-glow-primary inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 sm:px-4"
              >
                <Upload size={15} />
                <span>Upload</span>
              </button>
            </>
          )}

          {/* ⭐ PROFILE BUTTON — selalu tampil */}
          <button
            onClick={handleOpenProfile}
            className="group ml-1 flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-2 pr-3 transition-all hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)]"
            title="Profil Saya"
          >
            <div
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${
                user?.role === "owner"
                  ? "y-gradient-brand"
                  : user?.role === "super_admin"
                    ? "bg-[#f59e0b]"
                    : "bg-[var(--y-primary)]"
              }`}
            >
              {initials}
            </div>
            <span className="hidden max-w-[100px] truncate text-[12px] font-semibold text-[var(--y-text)] sm:inline">
              {user?.username || "User"}
            </span>
            <UserIcon
              size={13}
              className="text-[var(--y-text-mute)] transition-colors group-hover:text-[var(--y-primary)]"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
