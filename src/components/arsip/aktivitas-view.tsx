// Halaman Aktivitas: backend belum menyediakan endpoint riwayat.
// Tampilkan state jujur "belum terintegrasi", BUKAN log palsu.
"use client";

import { Activity } from "lucide-react";
import { PageHeader } from "./page-header";

export function AktivitasView() {
  return (
    <div>
      <PageHeader
        title="Aktivitas"
        description="Riwayat upload, unduh, dan perubahan arsip oleh pengguna."
      />
      <div className="grid place-items-center rounded-xl border border-dashed border-[var(--y-border)] bg-[var(--y-bg-elev)] px-6 py-14 text-center">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-[var(--y-bg-elev-2)]">
          <Activity size={22} className="text-[var(--y-text-dim)]" />
        </div>
        <p className="max-w-sm text-sm font-medium text-[var(--y-text)]">
          Riwayat aktivitas belum terintegrasi.
        </p>
        <p className="mt-1 max-w-md text-[13px] leading-relaxed text-[var(--y-text-dim)]">
          Backend belum menyediakan endpoint pencatatan aktivitas, sehingga halaman ini
          belum dapat menampilkan data. Kebutuhan backend: endpoint riwayat
          (pengguna, aksi, dokumen, waktu, status).
        </p>
      </div>
    </div>
  );
}
