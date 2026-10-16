// Halaman Profil: info akun, mode tampilan peran, keluar.
"use client";

import { UserRound, ShieldCheck, User, LogOut, Info } from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import type { RoleKey } from "@/lib/yudit/types";
import { PageHeader } from "./page-header";
import { cn } from "@/lib/utils";

export function ProfilView() {
  const user = useYudit((s) => s.user);
  const role = useYudit((s) => s.role);
  const setRole = useYudit((s) => s.setRole);
  const showConfirm = useYudit((s) => s.showConfirm);
  const logout = useYudit((s) => s.logout);

  return (
    <div>
      <PageHeader
        title="Profil"
        description="Informasi akun dan pengaturan tampilan peran."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5" aria-label="Informasi akun">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--y-primary)] text-lg font-bold text-white">
              {(user?.username || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[var(--y-text)]">{user?.username || "Pengguna"}</p>
              <p className="truncate text-sm text-[var(--y-text-dim)]">{user?.email || "—"}</p>
            </div>
          </div>
          <button
            onClick={() => showConfirm("Keluar aplikasi?", "Kamu akan keluar dari akun ini.", logout)}
            className="y-focus mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3.5 text-sm font-medium text-[var(--y-danger)] hover:bg-red-50"
          >
            <LogOut size={15} />
            Keluar
          </button>
        </section>

        <section className="rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5" aria-label="Mode tampilan">
          <h2 className="text-sm font-semibold text-[var(--y-text)]">Mode tampilan</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--y-text-dim)]">
            Mengatur navigasi yang terlihat. Hak akses final tetap diperiksa oleh backend.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Pilih peran tampilan">
            {(["pegawai", "admin"] as RoleKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={cn(
                  "y-focus flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left",
                  role === r
                    ? "border-[var(--y-primary)] bg-[#e4e9f0]"
                    : "border-[var(--y-border)] hover:bg-[var(--y-bg-hover)]",
                )}
              >
                {r === "pegawai" ? <User size={17} className="shrink-0" /> : <ShieldCheck size={17} className="shrink-0" />}
                <span>
                  <span className="block text-sm font-semibold capitalize text-[var(--y-text)]">{r}</span>
                  <span className="block text-xs text-[var(--y-text-dim)]">
                    {r === "pegawai" ? "Cari, preview, unduh" : "Kelola arsip & unggah"}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-[var(--y-text-mute)]">
            <Info size={13} className="mt-0.5 shrink-0" />
            Kebutuhan backend: field peran pada akun dan endpoint pengelolaan pengguna agar peran
            bersifat resmi, bukan sekadar tampilan.
          </p>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5" aria-label="Tentang sistem">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--y-text)]">
          <UserRound size={15} /> Arsip Digital · Bagian Persidangan DPRD Kabupaten Kuningan
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--y-text-dim)]">
          Sistem pengelolaan arsip dokumen internal. Seluruh dokumen di halaman ini bersifat
          internal dan tidak untuk publikasi.
        </p>
      </section>
    </div>
  );
}
