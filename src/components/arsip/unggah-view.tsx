// Halaman Unggah (admin): satu/ banyak file, kategori per file,
// metadata tambahan disiapkan sebagai UI (butuh dukungan backend).
"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, RotateCcw, CheckCircle2, AlertCircle, FileUp } from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import { uploadFile, updateCategory } from "@/lib/api/files";
import { formatBytes } from "@/lib/yudit/utils";
import { FileIcon } from "@/components/yudit/ui/file-icon";
import { PageHeader } from "./page-header";
import { EmptyState } from "./state-views";

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB, validasi sisi klien
const BLOCKED_EXT = ["exe", "bat", "cmd", "sh", "msi", "com", "scr"];

type QueueStatus = "antre" | "mengunggah" | "berhasil" | "gagal";

interface QueueItem {
  key: string;
  file: File;
  category: string;
  nomorSurat: string;
  tanggalDokumen: string;
  status: QueueStatus;
  progress: number;
  error?: string;
}

export function UnggahView() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useYudit((s) => s.fetchFiles);
  const defaultCategories = useYudit((s) => s.defaultCategories);
  const customCategories = useYudit((s) => s.customCategories);
  const categories = [...defaultCategories.map((c) => c.name), ...customCategories.map((c) => c.name)];

  const addFiles = (list: File[]) => {
    const items: QueueItem[] = [];
    for (const file of list) {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (BLOCKED_EXT.includes(ext)) {
        items.push({
          key: `${file.name}-${file.size}-${Date.now()}`,
          file, category: "", nomorSurat: "", tanggalDokumen: "",
          status: "gagal", progress: 0,
          error: "Tipe file tidak diizinkan.",
        });
        continue;
      }
      if (file.size > MAX_SIZE) {
        items.push({
          key: `${file.name}-${file.size}-${Date.now()}`,
          file, category: "", nomorSurat: "", tanggalDokumen: "",
          status: "gagal", progress: 0,
          error: `Ukuran melebihi batas ${formatBytes(MAX_SIZE)}.`,
        });
        continue;
      }
      items.push({
        key: `${file.name}-${file.size}-${Date.now()}`,
        file, category: "", nomorSurat: "", tanggalDokumen: "",
        status: "antre", progress: 0,
      });
    }
    setQueue((q) => [...q, ...items]);
  };

  const patchItem = (key: string, patch: Partial<QueueItem>) =>
    setQueue((q) => q.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  const startUpload = async () => {
    if (busy) return;
    const pending = queue.filter((it) => it.status === "antre" || it.status === "gagal");
    if (pending.length === 0) return;
    setBusy(true);
    for (const item of pending) {
      if (item.status === "gagal" && item.error) continue; // gagal validasi, lewati
      patchItem(item.key, { status: "mengunggah", progress: 0, error: undefined });
      try {
        const res = await uploadFile(item.file, undefined, (pct) =>
          patchItem(item.key, { progress: pct }),
        );
        if (item.category) {
          await updateCategory(res.file.id, item.category);
        }
        patchItem(item.key, { status: "berhasil", progress: 100 });
      } catch (e) {
        patchItem(item.key, {
          status: "gagal",
          error: e instanceof Error ? e.message : "Upload gagal. Silakan coba lagi.",
        });
      }
    }
    setBusy(false);
    fetchFiles();
  };

  const ready = queue.filter((it) => it.status === "antre").length;
  const done = queue.filter((it) => it.status === "berhasil").length;
  const failed = queue.filter((it) => it.status === "gagal").length;

  return (
    <div>
      <PageHeader
        title="Unggah Dokumen"
        description="Pilih satu atau banyak dokumen. Isi kategori per dokumen sebelum mengunggah."
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        role="button"
        tabIndex={0}
        aria-label="Pilih file untuk diunggah"
        className={`y-focus mb-4 grid cursor-pointer place-items-center rounded-xl border border-dashed px-6 py-10 text-center ${
          dragOver ? "border-[var(--y-primary)] bg-[#e4e9f0]" : "border-[var(--y-border)] bg-[var(--y-bg-elev)]"
        }`}
      >
        <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-[var(--y-bg-elev-2)]">
          <UploadCloud size={22} className="text-[var(--y-primary)]" />
        </div>
        <p className="text-sm font-medium text-[var(--y-text)]">Seret file ke sini atau klik untuk memilih</p>
        <p className="tnum mt-1 text-[13px] text-[var(--y-text-dim)]">
          PDF, gambar, Office, dan arsip umum · maksimal {formatBytes(MAX_SIZE)} per file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { addFiles(Array.from(e.target.files || [])); e.target.value = ""; }}
        />
      </div>

      {queue.length === 0 ? (
        <EmptyState title="File belum dipilih." hint="Dokumen yang dipilih akan muncul di antrean ini." />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="tnum text-[13px] text-[var(--y-text-dim)]">
              {queue.length} file · {ready} siap · {done} berhasil{failed ? ` · ${failed} gagal` : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setQueue([])}
                disabled={busy}
                className="y-focus h-9 rounded-lg border border-[var(--y-border)] px-3.5 text-sm font-medium text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] disabled:opacity-40"
              >
                Bersihkan
              </button>
              <button
                onClick={startUpload}
                disabled={busy || ready === 0}
                className="y-focus inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--y-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--y-primary-hover)] disabled:opacity-40"
              >
                <FileUp size={15} />
                {busy ? "Mengunggah…" : `Unggah ${ready} file`}
              </button>
            </div>
          </div>

          <ul className="space-y-3">
            {queue.map((it) => (
              <li key={it.key} className="rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-4">
                <div className="flex items-start gap-3">
                  <FileIcon mime={it.file.type} name={it.file.name} size={20} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--y-text)]" title={it.file.name}>{it.file.name}</p>
                    <p className="tnum text-xs text-[var(--y-text-dim)]">{formatBytes(it.file.size)}</p>
                  </div>
                  {it.status === "berhasil" && <CheckCircle2 size={18} className="shrink-0 text-[var(--y-success)]" aria-label="Berhasil" />}
                  {it.status === "gagal" && <AlertCircle size={18} className="shrink-0 text-[var(--y-danger)]" aria-label="Gagal" />}
                  {(it.status === "antre" || it.status === "gagal") && !busy && (
                    <button
                      onClick={() => setQueue((q) => q.filter((x) => x.key !== it.key))}
                      className="y-focus grid h-8 w-8 place-items-center rounded-lg text-[var(--y-text-mute)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-danger)]"
                      aria-label={`Hapus ${it.file.name} dari antrean`}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {it.status === "mengunggah" && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--y-bg-hover)]" role="progressbar" aria-valuenow={it.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Mengunggah ${it.file.name}`}>
                    <div className="h-full rounded-full bg-[var(--y-primary)] transition-all" style={{ width: `${it.progress}%` }} />
                  </div>
                )}
                {it.status === "gagal" && it.error && (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--y-danger)]" role="alert">
                    {it.error}
                    {!BLOCKED_EXT.includes((it.file.name.split(".").pop() || "").toLowerCase()) && it.file.size <= MAX_SIZE && (
                      <button
                        onClick={() => patchItem(it.key, { status: "antre", error: undefined, progress: 0 })}
                        className="y-focus ml-1 inline-flex items-center gap-1 font-medium underline"
                      >
                        <RotateCcw size={13} /> Coba lagi
                      </button>
                    )}
                  </p>
                )}

                {(it.status === "antre" || it.status === "gagal") && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--y-text-dim)]">Kategori</label>
                      <select
                        value={it.category}
                        onChange={(e) => patchItem(it.key, { category: e.target.value })}
                        className="y-focus h-9 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-2 text-[13px] text-[var(--y-text)]"
                      >
                        <option value="">Pilih kategori…</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div title="Membutuhkan dukungan backend untuk menyimpan metadata ini">
                      <label className="mb-1 block text-xs font-medium text-[var(--y-text-dim)]">
                        Nomor surat <span className="font-normal">(segera)</span>
                      </label>
                      <input
                        value={it.nomorSurat}
                        disabled
                        placeholder="Butuh dukungan backend"
                        className="h-9 w-full cursor-not-allowed rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-hover)] px-2 text-[13px] text-[var(--y-text-mute)]"
                      />
                    </div>
                    <div title="Membutuhkan dukungan backend untuk menyimpan metadata ini">
                      <label className="mb-1 block text-xs font-medium text-[var(--y-text-dim)]">
                        Tanggal dokumen <span className="font-normal">(segera)</span>
                      </label>
                      <input
                        type="date"
                        value={it.tanggalDokumen}
                        disabled
                        className="h-9 w-full cursor-not-allowed rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-hover)] px-2 text-[13px] text-[var(--y-text-mute)]"
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
