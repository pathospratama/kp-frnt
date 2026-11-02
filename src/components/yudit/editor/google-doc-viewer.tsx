// src/components/yudit/editor/google-doc-viewer.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import {
  convertToGoogleDoc,
  syncFromGoogleDoc,
  type GoogleDocInfo,
} from "@/lib/api/docs";
import { cn } from "@/lib/utils";

interface GoogleDocViewerProps {
  fileId: string;
  fileName: string;
  existingDocId?: string | null;
  onClose: () => void;
  onSyncBack?: () => void;
}

export function GoogleDocViewer({
  fileId,
  fileName,
  existingDocId,
  onClose,
  onSyncBack,
}: GoogleDocViewerProps) {
  const [info, setInfo] = useState<GoogleDocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // ---- Convert / load ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await convertToGoogleDoc(fileId);
        if (!cancelled) {
          setInfo(res);
        }
      } catch (e: unknown) {
        const err = e as { detail?: string; status?: number };
        const msg =
          err?.status === 401
            ? "Google Drive tidak valid. Reconnect di menu Google Drive."
            : err?.detail || "Gagal membuka Google Doc";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  // ---- Sync back to .docx ----
  const handleSyncBack = async () => {
    setSyncing(true);
    const toastId = toast.loading("Menyimpan perubahan ke .docx…");
    try {
      await syncFromGoogleDoc(fileId);
      toast.success("Berhasil disimpan ke .docx", { id: toastId });
      onSyncBack?.();
    } catch (e: unknown) {
      const err = e as { detail?: string };
      toast.error(err?.detail || "Gagal sync", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  // ---- Loading ----
  if (loading) {
    return (
      <div className="fixed inset-0 z-[2000] grid place-items-center bg-black/80 backdrop-blur">
        <div className="text-center text-white">
          <Loader2
            size={40}
            className="mx-auto animate-spin text-[var(--y-primary)]"
          />
          <div className="mt-4 text-sm">Convert ke Google Doc…</div>
          <div className="mt-1 text-xs text-white/60">
            Google Drive sedang memproses file
          </div>
        </div>
      </div>
    );
  }

  // ---- Error ----
  if (error || !info) {
    return (
      <div className="fixed inset-0 z-[2000] grid place-items-center bg-black/80 p-4 backdrop-blur">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-6 text-center"
        >
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(239,68,68,0.15)]">
            <AlertCircle size={28} className="text-[var(--y-danger)]" />
          </div>
          <h3 className="mb-2 text-base font-semibold text-[var(--y-text)]">
            Gagal Membuka Google Docs
          </h3>
          <p className="mb-5 text-sm text-[var(--y-text-dim)]">
            {error || "Terjadi kesalahan"}
          </p>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] text-sm font-semibold"
          >
            Tutup
          </button>
        </motion.div>
      </div>
    );
  }

  // ---- Success: embed iframe ----
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[2000] flex flex-col bg-[var(--y-bg)]"
    >
      {/* Header */}
      <div className="y-glass flex h-14 items-center gap-3 border-b border-[var(--y-border)] px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#4285f4]">
          <FileText size={17} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--y-text)]">
            {info.name || fileName}
          </div>
          <div className="text-[11px] text-[var(--y-success)]">
            ● Google Docs — fidelity 100%
          </div>
        </div>

        {/* Sync back */}
        <button
          onClick={handleSyncBack}
          disabled={syncing}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--y-border)] px-3 text-xs font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] disabled:opacity-60"
          title="Simpan balik ke .docx"
        >
          {syncing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          <span className="hidden sm:inline">Sync ke .docx</span>
        </button>

        {/* Open in new tab */}
        <a
          href={info.edit_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--y-border)] px-3 text-xs font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
          title="Buka di tab baru"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">Tab Baru</span>
        </a>

        {/* Close */}
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-lg text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Iframe */}
      <div className="flex-1 bg-white">
        <iframe
          src={info.embed_url}
          className="h-full w-full border-0"
          title={info.name}
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
        />
      </div>

      {/* Footer hint */}
      <div className="border-t border-[var(--y-border)] bg-[var(--y-bg-elev)] px-4 py-2 text-center text-[11px] text-[var(--y-text-mute)]">
        💡 Edit langsung di sini. Klik <b>Sync ke .docx</b> untuk menyimpan
        balik ke Yudit Cloud.
      </div>
    </motion.div>
  );
}