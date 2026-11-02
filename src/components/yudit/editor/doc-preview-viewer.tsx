// src/components/yudit/editor/doc-preview-viewer.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  X,
  Download,
  FileSearch,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { fetchRawDocx } from "@/lib/api/docs";
import { cn } from "@/lib/utils";

// =====================================================
// PROPS
// =====================================================
interface DocPreviewViewerProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

// =====================================================
// COMPONENT
// =====================================================
export function DocPreviewViewer({
  fileId,
  fileName,
  onClose,
}: DocPreviewViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  // ---- Load & render docx ----
  const loadDocx = useCallback(async () => {
    if (!containerRef.current) return;
    setLoading(true);
    setError(null);

    try {
      // Download binary .docx
      const blob = await fetchRawDocx(fileId);

      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";

      // ✅ Dynamic import — type declaration dari docx-preview sudah include
      const { renderAsync } = await import("docx-preview");

      await renderAsync(blob, containerRef.current, undefined, {
        className: "docx-preview-wrapper",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        experimental: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      });

      setLoading(false);
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string; status?: number };
      const msg =
        err?.status === 401
          ? "Google Drive tidak valid. Reconnect dulu."
          : err?.detail || err?.message || "Gagal render dokumen";
      setError(msg);
      setLoading(false);
    }
  }, [fileId]);

useEffect(() => {
  loadDocx();
}, [loadDocx]);

// ---- Download original ----
  const handleDownload = async () => {
    const toastId = toast.loading("Mengunduh…");
    try {
      const blob = await fetchRawDocx(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success("Berhasil diunduh", { id: toastId });
    } catch {
      toast.error("Gagal download", { id: toastId });
    }
  };

  // ---- Zoom controls ----
  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleZoomReset = () => setZoom(100);

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[2000] flex flex-col bg-[var(--y-bg)]"
    >
      {/* ===== HEADER ===== */}
      <div className="y-glass flex h-14 items-center gap-3 border-b border-[var(--y-border)] px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(34,211,238,0.15)]">
          <FileSearch size={17} className="text-[var(--y-accent)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--y-text)]">
            {fileName}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--y-accent)]">
            <span>●</span>
            <span>Preview Asli — fidelity 100%</span>
          </div>
        </div>

        {/* Zoom controls */}
        {!loading && !error && (
          <div className="flex items-center gap-0.5 rounded-lg border border-[var(--y-border)] px-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              title="Zoom out"
              className="grid h-8 w-8 place-items-center rounded text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] disabled:opacity-30"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={handleZoomReset}
              title="Reset zoom"
              className="min-w-[44px] text-[11px] font-semibold tabular-nums text-[var(--y-text-dim)] hover:text-[var(--y-text)]"
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              title="Zoom in"
              className="grid h-8 w-8 place-items-center rounded text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)] disabled:opacity-30"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        )}

        {/* Reload */}
        <button
          onClick={loadDocx}
          disabled={loading}
          title="Muat ulang"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--y-border)] px-3 text-xs font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Reload</span>
        </button>

        {/* Download */}
        <button
          onClick={handleDownload}
          title="Download .docx"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--y-border)] px-3 text-xs font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Download</span>
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          title="Tutup"
          className="grid h-9 w-9 place-items-center rounded-lg text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
        >
          <X size={18} />
        </button>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="relative flex-1 overflow-auto bg-[#525659] p-4">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/40 backdrop-blur-sm">
            <div className="text-center text-white">
              <Loader2
                size={40}
                className="mx-auto animate-spin text-[var(--y-accent)]"
              />
              <div className="mt-4 text-sm font-semibold">
                Merender dokumen…
              </div>
              <div className="mt-1 text-xs text-white/60">
                Memuat semua tabel, gambar, dan style
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mx-auto max-w-md rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-6 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(239,68,68,0.15)]">
              <AlertCircle size={28} className="text-[var(--y-danger)]" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-[var(--y-text)]">
              Gagal Render Dokumen
            </h3>
            <p className="mb-4 text-sm text-[var(--y-text-dim)]">{error}</p>
            <button
              onClick={loadDocx}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-4 text-sm font-semibold text-[var(--y-text)] hover:bg-[var(--y-bg-hover)]"
            >
              <RefreshCw size={14} />
              Coba Lagi
            </button>
          </div>
        )}

        {/* Render container */}
        <div
          ref={containerRef}
          className={cn(
            "docx-preview-container mx-auto",
            loading && "invisible",
          )}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.2s ease",
          }}
        />
      </div>

      {/* ===== FOOTER ===== */}
      <div className="border-t border-[var(--y-border)] bg-[var(--y-bg-elev)] px-4 py-2 text-center text-[11px] text-[var(--y-text-mute)]">
        💡 Preview asli dari file <b>.docx</b> — tidak bisa diedit. Untuk edit,
        tutup preview lalu pilih <b>"Google Docs"</b> atau <b>"Edit Cepat"</b>.
      </div>
    </motion.div>
  );
}