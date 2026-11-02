// src/components/yudit/views/convert-view.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileStack,
  Scissors,
  FileImage,
  FileText,
  FileType2,
  Minimize2,
  ScanLine,
  ScanText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  ArrowRight,
  Package2,
  RefreshCw,
  Inbox,
  Sparkles,
  Info,
} from "lucide-react";
import { useYudit, canManageWorkspace } from "@/lib/yudit/store";

import type {
  FileItem,
  ConversionOperation,
  ConversionJob,
} from "@/lib/yudit/types";
import { FileIcon } from "../ui/file-icon";
import { formatBytes, formatDate } from "@/lib/yudit/utils";
import { cn } from "@/lib/utils";

// =====================================================
// OPERATION META
// =====================================================
interface OpMeta {
  key: ConversionOperation;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  multi?: boolean;
  extensions: string[];
}

const OPERATIONS: OpMeta[] = [
  {
    key: "merge_pdf",
    label: "Merge PDF",
    desc: "Gabungkan beberapa PDF jadi satu",
    icon: <FileStack size={18} />,
    color: "#a78bfa",
    bg: "rgba(139,92,246,0.15)",
    multi: true,
    extensions: ["pdf"],
  },
  {
    key: "split_pdf",
    label: "Split PDF",
    desc: "Pecah PDF jadi beberapa bagian",
    icon: <Scissors size={18} />,
    color: "#f472b6",
    bg: "rgba(236,72,153,0.15)",
    extensions: ["pdf"],
  },
  {
    key: "compress_pdf",
    label: "Compress PDF",
    desc: "Kecilkan ukuran PDF",
    icon: <Minimize2 size={18} />,
    color: "#22d3ee",
    bg: "rgba(6,182,212,0.15)",
    extensions: ["pdf"],
  },
  {
    key: "jpg_to_pdf",
    label: "JPG → PDF",
    desc: "Ubah gambar jadi PDF",
    icon: <FileImage size={18} />,
    color: "#34d399",
    bg: "rgba(16,185,129,0.15)",
    multi: true,
    extensions: ["jpg", "jpeg", "png", "webp", "tiff", "bmp"],
  },
  {
    key: "word_to_pdf",
    label: "WORD → PDF",
    desc: "Ubah Word/Excel/PPT jadi PDF",
    icon: <FileText size={18} />,
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.15)",
    extensions: [
      "doc", "docx", "xls", "xlsx",
      "ppt", "pptx", "odt", "ods", "odp",
    ],
  },
  {
    key: "pdf_to_word",
    label: "PDF → WORD",
    desc: "Ubah PDF jadi Word (format preserved)",
    icon: <FileType2 size={18} />,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.15)",
    extensions: ["pdf"],
  },
  {
    key: "pdf_to_jpg",
    label: "PDF → JPG",
    desc: "Ubah halaman PDF jadi gambar",
    icon: <FileImage size={18} />,
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.15)",
    extensions: ["pdf"],
  },
  {
    key: "pdf_to_markdown",
    label: "PDF → Markdown",
    desc: "Premium — butuh upgrade iLovePDF",
    icon: <FileType2 size={18} />,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    extensions: ["pdf"],
  },
  {
    key: "scan_to_pdf",
    label: "Scan → PDF",
    desc: "Scan foto dokumen jadi PDF",
    icon: <ScanLine size={18} />,
    color: "#e879f9",
    bg: "rgba(217,70,239,0.15)",
    multi: true,
    extensions: ["jpg", "jpeg", "png", "webp", "tiff"],
  },
  {
    key: "ocr_pdf",
    label: "OCR PDF",
    desc: "Premium — butuh upgrade iLovePDF",
    icon: <ScanText size={18} />,
    color: "#f87171",
    bg: "rgba(239,68,68,0.15)",
    extensions: ["pdf"],
  },
];

// =====================================================
// MAIN VIEW
// =====================================================
export function ConvertView() {
  const files = useYudit((s) => s.files);
  const filesLoading = useYudit((s) => s.filesLoading);
  const fetchFiles = useYudit((s) => s.fetchFiles);
  const fetchConversionJobs = useYudit((s) => s.fetchConversionJobs);
  const conversionJobs = useYudit((s) => s.conversionJobs);
  const runConversion = useYudit((s) => s.runConversion);
  const converting = useYudit((s) => s.converting);
  const drives = useYudit((s) => s.drives);
  const setView = useYudit((s) => s.setView);
  const user = useYudit((s) => s.user);
  const isManager = canManageWorkspace(user);

  const [selectedOp, setSelectedOp] = useState<OpMeta>(OPERATIONS[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Opsi tambahan per operasi
  const [compressLevel, setCompressLevel] = useState<
    "low" | "recommended" | "extreme"
  >("extreme");
  const [pdfjpgMode, setPdfjpgMode] = useState<"pages" | "extract">("pages");

  // Fetch awal
  useEffect(() => {
    fetchFiles();
    fetchConversionJobs();
  }, [fetchFiles, fetchConversionJobs]);

  // Reset selection saat ganti operasi
  useEffect(() => {
    setSelectedIds([]);
    setSearch("");
  }, [selectedOp.key]);

  // Filter file sesuai operasi
  const eligibleFiles = useMemo(() => {
    const exts = new Set(selectedOp.extensions);
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      const ext = (f.file_type || f.name.split(".").pop() || "").toLowerCase();
      if (!exts.has(ext)) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [files, selectedOp, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (!selectedOp.multi) return prev.includes(id) ? [] : [id];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const canConvert =
    selectedIds.length > 0 &&
    (selectedOp.key !== "merge_pdf" || selectedIds.length >= 2) &&
    !converting;

  const handleConvert = async () => {
    if (!canConvert) return;

    let params: Record<string, unknown> = {};
    if (selectedOp.key === "compress_pdf") {
      params = { compression_level: compressLevel };
    } else if (selectedOp.key === "pdf_to_jpg") {
      params = { pdfjpg_mode: pdfjpgMode };
    }

    const res = await runConversion(selectedOp.key, selectedIds, params);
    if (res) setSelectedIds([]);
  };

  const noDrives = isManager && drives.length === 0;

  return (
    <div className="y-anim-fade">
      {/* =====================================================
          HEADER
          ===================================================== */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--y-text)]">
          Konversi Dokumen
        </h1>
        <p className="text-[13px] text-[var(--y-text-dim)]">
          Hanya untuk file yang sudah diupload ke Yudit Cloud. File asli tetap
          aman — hasil adalah file baru.
        </p>
      </div>

      {/* =====================================================
          BANNER: NO DRIVES (owner/super_admin)
          ===================================================== */}
      {noDrives && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(245,158,11,0.18)]">
            <Sparkles size={16} className="text-[var(--y-warn)]" />
          </div>
          <div className="flex-1 text-[13px] leading-relaxed text-[var(--y-text-dim)]">
            <b className="text-[var(--y-text)]">Hubungkan Google Drive dulu.</b>{" "}
            Hasil konversi disimpan ke storage pool Anda.
          </div>
          <button
            onClick={() => setView("drives")}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--y-warn)] px-3 text-[12px] font-semibold text-white"
          >
            Connect <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* =====================================================
          ⭐ BANNER: MODE MEMBER (dipindah dari dalam card)
          ===================================================== */}
      {!isManager && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[var(--y-border-soft)] bg-[rgba(99,102,241,0.06)] p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(99,102,241,0.15)]">
            <Info size={16} className="text-[var(--y-primary)]" />
          </div>
          <div className="text-[13px] leading-relaxed text-[var(--y-text-dim)]">
            <b className="text-[var(--y-text)]">Mode Member.</b> Konversi
            tersedia — file hasil akan disimpan ke storage pool owner.
          </div>
        </div>
      )}

      {/* =====================================================
          OPERATION PICKER
          ===================================================== */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {OPERATIONS.map((op) => {
          const active = selectedOp.key === op.key;
          return (
            <motion.button
              key={op.key}
              onClick={() => setSelectedOp(op)}
              whileHover={{ y: -2 }}
              className={cn(
                "group relative flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-all",
                active
                  ? "border-[var(--y-primary)] bg-[rgba(99,102,241,0.1)] shadow-[0_0_0_2px_var(--y-primary-glow)]"
                  : "border-[var(--y-border)] bg-[var(--y-bg-elev)] hover:border-[var(--y-primary)]",
              )}
            >
              <div
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{ background: op.bg, color: op.color }}
              >
                {op.icon}
              </div>
              <div>
                <div className="text-[12px] font-bold text-[var(--y-text)]">
                  {op.label}
                </div>
                <div className="mt-0.5 text-[10px] leading-tight text-[var(--y-text-mute)]">
                  {op.desc}
                </div>
              </div>
              {active && (
                <CheckCircle2
                  size={13}
                  className="absolute right-2 top-2 text-[var(--y-primary)]"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* =====================================================
          MAIN PANEL
          ===================================================== */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* ============================================
            FILE SELECTOR
            ============================================ */}
        <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-[var(--y-text)]">
                Pilih File
                {selectedIds.length > 0 && (
                  <span className="ml-2 rounded-full bg-[var(--y-primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                    {selectedIds.length} dipilih
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--y-text-mute)]">
                Format didukung:{" "}
                {selectedOp.extensions.join(", ").toUpperCase()}
              </div>
            </div>
            <button
              onClick={() => fetchFiles()}
              disabled={filesLoading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--y-border)] px-2.5 text-[11px] font-semibold text-[var(--y-text-dim)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={filesLoading ? "animate-spin" : ""}
              />
              Reload
            </button>
          </div>

          <div className="relative mb-3">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari file…"
              className="y-focus h-9 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] pl-9 pr-9 text-[13px] text-[var(--y-text)] placeholder:text-[var(--y-text-mute)] outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] hover:text-[var(--y-text)]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {filesLoading && files.length === 0 ? (
            <div className="grid place-items-center py-14">
              <Loader2
                size={24}
                className="animate-spin text-[var(--y-primary)]"
              />
            </div>
          ) : eligibleFiles.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-[var(--y-border)] py-12 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--y-bg)]">
                <Inbox size={24} className="text-[var(--y-text-mute)]" />
              </div>
              <div className="mt-3 text-[12.5px] font-semibold text-[var(--y-text-dim)]">
                {search
                  ? "Tidak ada file yang cocok"
                  : "Belum ada file dengan format ini"}
              </div>
              <div className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-[var(--y-text-mute)]">
                Upload dulu file{" "}
                <b className="text-[var(--y-text-dim)]">
                  {selectedOp.extensions.join(" / ").toUpperCase()}
                </b>{" "}
                di menu My Files.
              </div>
            </div>
          ) : (
            <div className="flex max-h-[520px] flex-col gap-1 overflow-y-auto pr-1">
              {eligibleFiles.map((f) => (
                <ConvertFileRow
                  key={f.id}
                  file={f}
                  selected={selectedIds.includes(f.id)}
                  onToggle={() => toggleSelect(f.id)}
                />
              ))}
            </div>
          )}

          {eligibleFiles.length > 1 && (
            <div className="mt-3 flex items-center justify-between border-t border-[var(--y-border-soft)] pt-2.5 text-[11px] text-[var(--y-text-mute)]">
              <span>{eligibleFiles.length} file tersedia</span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setSelectedIds(eligibleFiles.map((f) => f.id))
                  }
                  className="font-semibold text-[var(--y-primary)] hover:underline"
                >
                  Pilih semua
                </button>
                <span className="opacity-30">•</span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="font-semibold text-[var(--y-text-dim)] hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================
            RIGHT PANEL
            ============================================ */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{ background: selectedOp.bg, color: selectedOp.color }}
              >
                {selectedOp.icon}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-[var(--y-text)]">
                  {selectedOp.label}
                </div>
                <div className="text-[11px] text-[var(--y-text-mute)]">
                  {selectedIds.length} file dipilih
                </div>
              </div>
            </div>

            {/* Compress PDF options */}
            {selectedOp.key === "compress_pdf" && (
              <div className="mb-3 rounded-lg border border-[var(--y-border-soft)] bg-[var(--y-bg)] p-2.5">
                <label className="mb-1.5 block text-[11px] font-semibold text-[var(--y-text-mute)]">
                  Level Kompresi
                </label>
                <select
                  value={compressLevel}
                  onChange={(e) =>
                    setCompressLevel(e.target.value as typeof compressLevel)
                  }
                  className="y-focus h-9 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[13px] text-[var(--y-text)] outline-none"
                >
                  <option value="low">Low — kualitas terbaik</option>
                  <option value="recommended">Recommended — balance</option>
                  <option value="extreme">Extreme — ukuran terkecil</option>
                </select>
                <div className="mt-1.5 text-[10px] leading-tight text-[var(--y-text-mute)]">
                  💡 File dari Word/Excel biasanya hanya turun 10-20%. File
                  hasil scan bisa turun 50-70%.
                </div>
              </div>
            )}

            {/* PDF → JPG options */}
            {selectedOp.key === "pdf_to_jpg" && (
              <div className="mb-3 rounded-lg border border-[var(--y-border-soft)] bg-[var(--y-bg)] p-2.5">
                <label className="mb-1.5 block text-[11px] font-semibold text-[var(--y-text-mute)]">
                  Mode Konversi
                </label>
                <select
                  value={pdfjpgMode}
                  onChange={(e) =>
                    setPdfjpgMode(e.target.value as typeof pdfjpgMode)
                  }
                  className="y-focus h-9 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[13px] text-[var(--y-text)] outline-none"
                >
                  <option value="pages">Pages — tiap halaman jadi 1 JPG</option>
                  <option value="extract">Extract — ekstrak gambar</option>
                </select>
              </div>
            )}

            {/* PDF → Word info */}
            {selectedOp.key === "pdf_to_word" && (
              <div className="mb-3 rounded-lg border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.08)] p-2.5 text-[11px] leading-relaxed text-[#4ade80]">
                ✅ Konversi lokal (gratis, tanpa credits iLovePDF). Format font,
                spacing, tabel, & gambar dipertahankan.
              </div>
            )}

            {selectedIds.length > 0 && (
              <div className="mb-3 space-y-1 rounded-lg border border-[var(--y-border-soft)] bg-[var(--y-bg)] p-2">
                {selectedIds.slice(0, 5).map((id) => {
                  const f = files.find((x) => x.id === id);
                  if (!f) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 text-[11px] text-[var(--y-text-dim)]"
                    >
                      <FileIcon
                        mime={f.mime_type || ""}
                        name={f.name}
                        size={12}
                      />
                      <span className="truncate">{f.name}</span>
                    </div>
                  );
                })}
                {selectedIds.length > 5 && (
                  <div className="pt-1 text-[11px] text-[var(--y-text-mute)]">
                    +{selectedIds.length - 5} file lainnya
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConvert}
              disabled={!canConvert || noDrives}
              className={cn(
                "y-gradient-brand y-glow-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all",
                "hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
              )}
            >
              {converting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memproses…
                </>
              ) : (
                <>
                  Konversi Sekarang <ArrowRight size={16} />
                </>
              )}
            </button>

            {selectedOp.key === "merge_pdf" && selectedIds.length < 2 && (
              <div className="mt-2 text-center text-[11px] text-[var(--y-warn)]">
                Merge butuh minimal 2 file PDF
              </div>
            )}

            <div className="mt-3 text-[11px] leading-relaxed text-[var(--y-text-mute)]">
              💡 File asli tidak akan diubah. Hasil konversi menjadi file baru
              di folder bulanan Anda.
            </div>
          </div>

          {/* Jobs History */}
          <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package2 size={14} className="text-[var(--y-accent)]" />
                <span className="text-[13px] font-bold text-[var(--y-text)]">
                  Riwayat Konversi
                </span>
              </div>
              <button
                onClick={() => fetchConversionJobs()}
                className="text-[11px] font-semibold text-[var(--y-primary)] hover:underline"
              >
                Refresh
              </button>
            </div>
            {conversionJobs.length === 0 ? (
              <div className="py-6 text-center text-[11px] text-[var(--y-text-mute)]">
                Belum ada riwayat konversi
              </div>
            ) : (
              <div className="flex max-h-[320px] flex-col gap-1.5 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {conversionJobs.slice(0, 20).map((j) => (
                    <JobRow key={j.id} job={j} files={files} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// FILE ROW
// =====================================================
function ConvertFileRow({
  file,
  selected,
  onToggle,
}: {
  file: FileItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all",
        selected
          ? "border-[var(--y-primary)] bg-[rgba(99,102,241,0.12)]"
          : "border-transparent hover:border-[var(--y-border)] hover:bg-[var(--y-bg-hover)]",
      )}
    >
      <div
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
          selected
            ? "border-[var(--y-primary)] bg-[var(--y-primary)]"
            : "border-[var(--y-border)]",
        )}
      >
        {selected && (
          <CheckCircle2 size={13} className="text-white" strokeWidth={3} />
        )}
      </div>
      <FileIcon mime={file.mime_type || ""} name={file.name} size={16} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-[var(--y-text)]">
          {file.name}
        </div>
        <div className="text-[10.5px] text-[var(--y-text-mute)]">
          {formatBytes(file.size)} • {formatDate(file.created_at)}
        </div>
      </div>
    </button>
  );
}

// =====================================================
// JOB ROW
// =====================================================
function JobRow({
  job,
  files,
}: {
  job: ConversionJob;
  files: FileItem[];
}) {
  const src = files.find((f) => f.id === job.source_file_id);
  const res = job.result_file_id
    ? files.find((f) => f.id === job.result_file_id)
    : null;

  const createdDate = new Date(job.created_at);
  const time = createdDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = createdDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });

  const StatusIcon =
    job.status === "success"
      ? CheckCircle2
      : job.status === "failed"
        ? XCircle
        : Clock;

  const statusColor =
    job.status === "success"
      ? "text-[var(--y-success)]"
      : job.status === "failed"
        ? "text-[var(--y-danger)]"
        : "text-[var(--y-warn)]";

  const statusLabel =
    job.status === "success"
      ? "Berhasil"
      : job.status === "failed"
        ? "Gagal"
        : job.status === "processing"
          ? "Memproses…"
          : "Menunggu";

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 rounded-lg border border-[var(--y-border-soft)] bg-[var(--y-bg)] px-2 py-1.5"
    >
      <StatusIcon size={13} className={cn("mt-0.5 shrink-0", statusColor)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11.5px] font-semibold text-[var(--y-text)]">
          {job.operation.replace(/_/g, " ").toUpperCase()}
        </div>
        <div className="truncate text-[10.5px] text-[var(--y-text-dim)]">
          {src?.name || `${job.source_file_id.slice(0, 8)}…`}
        </div>
        {res && (
          <div className="truncate text-[10.5px] text-[var(--y-success)]">
            → {res.name}
          </div>
        )}
        {job.error_message && (
          <div
            className="truncate text-[10px] text-[var(--y-danger)]"
            title={job.error_message}
          >
            {job.error_message}
          </div>
        )}
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--y-text-mute)]">
          <span>
            {date} · {time}
          </span>
          <span className="opacity-40">•</span>
          <span className={statusColor}>{statusLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}