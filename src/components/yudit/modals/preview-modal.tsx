// src/components/yudit/modals/preview-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Download, Loader2, FileQuestion } from "lucide-react";

import { useYudit } from "@/lib/yudit/store";
import { formatBytes, formatDate, fileIconInfo, extOf } from "@/lib/yudit/utils";
import { fetchFileBlob } from "@/lib/api/files";
import { FileIcon } from "../ui/file-icon";
import { CategoryBadge } from "../ui/category-badge";

export function PreviewModal() {
  const previewFileId = useYudit((s) => s.previewFileId);
  const closePreview = useYudit((s) => s.closePreview);
  const files = useYudit((s) => s.files);
  const file = files.find((f) => f.id === previewFileId) || null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewFileId) closePreview();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewFileId, closePreview]);

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex flex-col"
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}
        >
          <div className="y-glass flex items-center gap-3 border-b border-white/10 px-5 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-[var(--y-text)]">
                {file.name}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[var(--y-text-dim)]">
                <span>{formatBytes(file.size)}</span>
                <span>•</span>
                <span>{formatDate(file.created_at)}</span>
                {file.category && (
                  <>
                    <span>•</span>
                    <CategoryBadge category={file.category} />
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <DownloadButton fileId={file.id} filename={file.name} />
              <button
                onClick={closePreview}
                className="grid h-9 w-9 place-items-center rounded-lg text-[var(--y-text-dim)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center overflow-auto p-6">
            <PreviewBody key={file.id} file={file} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =====================================================
// DOWNLOAD BUTTON
// =====================================================
function DownloadButton({ fileId, filename }: { fileId: string; filename: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await fetchFileBlob(fileId, "download");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Delay revoke supaya browser sempat trigger download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      setError(e?.detail || "Gagal download");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] font-semibold text-[var(--y-text)] transition-colors hover:bg-[var(--y-bg-hover)] disabled:opacity-60"
      title={error || "Download"}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
      <span className="hidden sm:inline">{error || "Download"}</span>
    </button>
  );
}

// =====================================================
// PREVIEW BODY — fetch blob
// =====================================================
function PreviewBody({
  file,
}: {
  file: { id: string; name: string; mime_type: string | null };
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const blob = await fetchFileBlob(file.id, "preview");
        url = URL.createObjectURL(blob);
        if (!cancelled) {
          setBlobUrl(url);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.detail || "Gagal memuat preview");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      // Jangan revoke terlalu cepat — biarkan browser pakai dulu
      if (url) setTimeout(() => URL.revokeObjectURL(url!), 500);
    };
  }, [file.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 text-[var(--y-text-dim)]">
        <Loader2 size={32} className="animate-spin text-[var(--y-primary)]" />
        <div className="text-sm">Memuat preview…</div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="text-center">
        <FileQuestion size={80} className="mx-auto mb-3 text-[var(--y-text-mute)]" />
        <div className="mb-1 text-base font-semibold text-[var(--y-text)]">
          {error || "Preview tidak tersedia"}
        </div>
        <div className="text-xs text-[var(--y-text-dim)]">
          Klik "Download" untuk mengunduh file
        </div>
      </div>
    );
  }

  return <PreviewContent file={file} url={blobUrl} />;
}

function PreviewContent({
  file,
  url,
}: {
  file: { name: string; mime_type: string | null };
  url: string;
}) {
  const ext = extOf(file.name);
  const mime = file.mime_type || "";
  const info = fileIconInfo(mime, file.name);

  // Image
  if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)
  ) {
    return (
      <motion.img
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        src={url}
        alt={file.name}
        className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain"
      />
    );
  }

  // Video
  if (mime.startsWith("video/") || ["mp4", "webm", "mov", "mkv"].includes(ext)) {
    return (
      <motion.video
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        src={url}
        controls
        autoPlay
        className="aspect-video max-h-[80vh] w-full max-w-4xl rounded-xl bg-black"
      />
    );
  }

  // Audio
  if (mime.startsWith("audio/") || ["mp3", "wav", "flac", "m4a"].includes(ext)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-8">
          <div className="mb-4 flex justify-center">
            <info.Icon size={64} style={{ color: info.color }} strokeWidth={1.5} />
          </div>
          <audio src={url} controls className="w-full" />
        </div>
      </motion.div>
    );
  }

  // PDF
  if (ext === "pdf") {
    return (
      <iframe
        src={url}
        className="h-[80vh] w-full max-w-4xl rounded-xl border border-[var(--y-border)] bg-white"
        title={file.name}
      />
    );
  }

  // Text / code
  if (
    ["txt", "md", "json", "csv", "xml", "log", "py", "js", "ts", "html", "css"].includes(ext)
  ) {
    return <TextPreview url={url} name={file.name} />;
  }

  // Fallback
  return (
    <div className="text-center">
      <FileQuestion size={80} className="mx-auto mb-3 text-[var(--y-text-mute)]" />
      <div className="mb-1 text-base font-semibold text-[var(--y-text)]">
        Preview tidak tersedia untuk tipe ini
      </div>
      <div className="text-xs text-[var(--y-text-dim)]">
        Klik "Download" untuk mengunduh file
      </div>
    </div>
  );
}

function TextPreview({ url, name }: { url: string; name: string }) {
  const [text, setText] = useState<string>("Memuat…");
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setText(t);
      })
      .catch(() => {
        if (!cancelled) setText("Gagal memuat teks");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <motion.pre
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="y-glow-soft max-h-full w-full max-w-3xl overflow-auto rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5 font-mono text-[13px] leading-relaxed text-[var(--y-text)] whitespace-pre-wrap"
    >
      {`// ${name}\n\n${text}`}
    </motion.pre>
  );
}