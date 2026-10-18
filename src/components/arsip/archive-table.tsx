// Tabel arsip: kolom kondisional (nomor surat & tanggal dokumen hanya
// tampil jika datanya tersedia), pagination client-side, aksi per peran.
"use client";

import { useMemo, useState } from "react";
import { Eye, Download, Share2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { FileItem } from "@/lib/yudit/types";
import { formatBytes, formatDate } from "@/lib/yudit/utils";
import { FileIcon } from "@/components/yudit/ui/file-icon";
import { CategoryBadge } from "@/components/yudit/ui/category-badge";
import { EmptyState, LoadingSkeleton } from "./state-views";

export type ArsipItem = FileItem & {
  nomor_surat?: string | null;
  tanggal_dokumen?: string | null;
};

const PAGE_SIZE = 15;

const iconBtn =
  "y-focus grid h-8 w-8 place-items-center rounded-lg text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] disabled:cursor-not-allowed disabled:opacity-40";

export function ArchiveTable({
  files,
  loading,
  isAdmin,
  categories,
  onPreview,
  onDownload,
  onShare,
  onDelete,
  onCategory,
  emptyAction,
}: {
  files: ArsipItem[];
  loading: boolean;
  isAdmin: boolean;
  categories: string[];
  onPreview: (id: string) => void;
  onDownload: (f: ArsipItem) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
  onCategory: (id: string, category: string) => void;
  emptyAction?: React.ReactNode;
}) {
  const [page, setPage] = useState(0);

  const showNomor = useMemo(() => files.some((f) => !!f.nomor_surat), [files]);
  const showTglDok = useMemo(() => files.some((f) => !!f.tanggal_dokumen), [files]);

  const pageCount = Math.max(1, Math.ceil(files.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = files.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  if (loading) return <LoadingSkeleton />;
  if (files.length === 0)
    return <EmptyState hint="Coba ubah kata kunci atau reset filter." action={emptyAction} />;

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)]">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--y-border)] bg-[var(--y-bg-elev-2)]">
              <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-[var(--y-text-dim)]">Nama dokumen</th>
              <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-[var(--y-text-dim)]">Kategori</th>
              {showNomor && (
                <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-[var(--y-text-dim)]">Nomor surat</th>
              )}
              {showTglDok && (
                <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-[var(--y-text-dim)]">Tanggal dokumen</th>
              )}
              <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-[var(--y-text-dim)]">Ukuran</th>
              <th scope="col" className="px-4 py-2.5 text-xs font-semibold text-[var(--y-text-dim)]">Tanggal unggah</th>
              <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-[var(--y-text-dim)]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="border-b border-[var(--y-border-soft)] last:border-0 hover:bg-[var(--y-bg-hover)]/60">
                <td className="max-w-[280px] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileIcon mime={f.mime_type || ""} name={f.name} size={20} />
                    <button
                      onClick={() => onPreview(f.id)}
                      className="y-focus min-w-0 flex-1 truncate text-left font-medium text-[var(--y-text)] hover:text-[var(--y-primary)] hover:underline"
                      title={f.name}
                    >
                      {f.name}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {isAdmin ? (
                    <select
                      value={f.category || ""}
                      onChange={(e) => onCategory(f.id, e.target.value)}
                      aria-label={`Ubah kategori ${f.name}`}
                      className="y-focus h-8 max-w-[150px] rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-1.5 text-xs text-[var(--y-text)]"
                    >
                      <option value="">Tanpa kategori</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <CategoryBadge category={f.category} />
                  )}
                </td>
                {showNomor && <td className="px-4 py-3 text-[var(--y-text-dim)]">{f.nomor_surat || "—"}</td>}
                {showTglDok && (
                  <td className="tnum whitespace-nowrap px-4 py-3 text-[var(--y-text-dim)]">
                    {f.tanggal_dokumen ? formatDate(f.tanggal_dokumen) : "—"}
                  </td>
                )}
                <td className="tnum whitespace-nowrap px-4 py-3 text-[var(--y-text-dim)]">{formatBytes(f.size)}</td>
                <td className="tnum whitespace-nowrap px-4 py-3 text-[var(--y-text-dim)]">{formatDate(f.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onPreview(f.id)} className={iconBtn} title="Preview" aria-label={`Preview ${f.name}`}>
                      <Eye size={16} />
                    </button>
                    <button onClick={() => onDownload(f)} className={iconBtn} title="Unduh" aria-label={`Unduh ${f.name}`}>
                      <Download size={16} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => onShare(f.id)} className={iconBtn} title="Bagikan" aria-label={`Bagikan ${f.name}`}>
                          <Share2 size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(f.id)}
                          className={`${iconBtn} hover:!text-[var(--y-danger)]`}
                          title="Hapus"
                          aria-label={`Hapus ${f.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <nav className="mt-3 flex items-center justify-between" aria-label="Pagination arsip">
          <p className="tnum text-[13px] text-[var(--y-text-dim)]">
            Halaman {safePage + 1} dari {pageCount} · {files.length} arsip
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="y-focus inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--y-border)] px-2.5 text-[13px] font-medium text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] disabled:opacity-40"
            >
              <ChevronLeft size={15} /> Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="y-focus inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--y-border)] px-2.5 text-[13px] font-medium text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] disabled:opacity-40"
            >
              Berikutnya <ChevronRight size={15} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
