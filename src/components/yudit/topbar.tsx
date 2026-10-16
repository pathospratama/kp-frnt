"use client";

import { Menu, Upload } from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import type { ViewKey } from "@/lib/yudit/types";

const TITLES: Record<ViewKey, string> = {
  arsip: "Arsip",
  ringkasan: "Ringkasan",
  unggah: "Unggah Dokumen",
  aktivitas: "Aktivitas",
  penyimpanan: "Penyimpanan",
  profil: "Profil",
};

export function Topbar() {
  const currentView = useYudit((s) => s.currentView);
  const setSidebarOpen = useYudit((s) => s.setSidebarOpen);
  const setView = useYudit((s) => s.setView);
  const role = useYudit((s) => s.role);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--y-border)] bg-[var(--y-bg-elev)] px-4 sm:px-6">
      <button
        onClick={() => setSidebarOpen(true)}
        className="y-focus grid h-9 w-9 place-items-center rounded-lg text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] lg:hidden"
        aria-label="Buka menu navigasi"
      >
        <Menu size={18} />
      </button>

      <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <span className="hidden shrink-0 text-[var(--y-text-mute)] sm:inline">Arsip Digital</span>
        <span className="hidden shrink-0 text-[var(--y-text-mute)] sm:inline" aria-hidden="true">/</span>
        <span className="truncate font-semibold text-[var(--y-text)]">{TITLES[currentView]}</span>
      </nav>

      {role === "admin" && currentView !== "unggah" && (
        <button
          onClick={() => setView("unggah")}
          className="y-focus inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--y-primary)] px-3.5 text-[13px] font-semibold text-white hover:bg-[var(--y-primary-hover)] sm:px-4"
        >
          <Upload size={15} />
          <span>Unggah</span>
        </button>
      )}
    </header>
  );
}
