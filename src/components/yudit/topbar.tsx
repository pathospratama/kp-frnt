"use client";

import { Menu, FolderPlus, Upload, ChevronRight } from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import type { ViewKey } from "@/lib/yudit/types";

const TITLES: Record<ViewKey, string> = {
  files: "My Files",
  monthly: "Arsip Per Bulan",
  stats: "Statistik & Analytics",
  drives: "Google Drive Accounts",
};

export function Topbar() {
  const currentView = useYudit((s) => s.currentView);
  const setSidebarOpen = useYudit((s) => s.setSidebarOpen);
  const uploadFiles = useYudit((s) => s.uploadFiles);
  const showConfirm = useYudit((s) => s.showConfirm);
  const drives = useYudit((s) => s.drives);

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
        // demo: just switch to files view
        useYudit.getState().setView("files");
      },
    );
  };

  return (
    <header className="y-glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--y-border)] px-4 sm:px-6">
      <button
        onClick={() => setSidebarOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-lg text-[var(--y-text-dim)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
        <span className="hidden text-[var(--y-text-mute)] sm:inline">Yudit Cloud</span>
        <ChevronRight size={14} className="hidden text-[var(--y-text-mute)] sm:inline" />
        <span className="truncate font-semibold text-[var(--y-text)]">
          {TITLES[currentView]}
        </span>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
