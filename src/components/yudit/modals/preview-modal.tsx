// src/components/yudit/modals/preview-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
<<<<<<< HEAD
import {
  X,
  Download,
  Loader2,
  FileQuestion,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
=======
import { X, Download, Loader2, FileQuestion } from "lucide-react";
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9

import { useYudit } from "@/lib/yudit/store";
import { formatBytes, formatDate, fileIconInfo, extOf } from "@/lib/yudit/utils";
import { fetchFileBlob } from "@/lib/api/files";
<<<<<<< HEAD
import { ApiError } from "@/lib/api/client";
import { FileIcon } from "../ui/file-icon";
import { CategoryBadge } from "../ui/category-badge";

// =====================================================
// ERROR STATE
// =====================================================
interface PreviewError {
  message: string;
  status: number;
  isDriveError: boolean;
  driveEmail?: string;
}

function toPreviewError(e: unknown): PreviewError {
  if (e instanceof ApiError) {
    return {
      message: e.detail || "Gagal memuat file",
      status: e.status,
      isDriveError: e.isDriveError || false,
      driveEmail: e.driveEmail,
    };
  }
  if (e instanceof Error) {
    return {
      message: e.message || "Gagal memuat file",
      status: 0,
      isDriveError: false,
    };
  }
  return {
    message: "Gagal memuat file",
    status: 0,
    isDriveError: false,
  };
}

// =====================================================
// MAIN MODAL
// =====================================================
=======
import { FileIcon } from "../ui/file-icon";
import { CategoryBadge } from "../ui/category-badge";

>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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
<<<<<<< HEAD
function DownloadButton({
  fileId,
  filename,
}: {
  fileId: string;
  filename: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    const toastId = toast.loading(`Mengunduh ${filename}…`);
=======
function DownloadButton({ fileId, filename }: { fileId: string; filename: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
    try {
      const blob = await fetchFileBlob(fileId, "download");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
<<<<<<< HEAD
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`"${filename}" berhasil diunduh`, { id: toastId });
    } catch (e) {
      // ⭐ FIX: Beri feedback untuk SEMUA kasus error (bukan silent)
      if (e instanceof ApiError && e.isDriveError) {
        toast.error(
          `${e.driveEmail || "Google Drive"} perlu di-reconnect. Buka menu "Google Drive".`,
          { id: toastId, duration: 10000 },
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("yudit:drive-auth-error", {
              detail: {
                email: e.driveEmail,
                driveId: e.driveId,
                message: e.detail,
              },
            }),
          );
        }
      } else if (e instanceof ApiError) {
        toast.error(e.detail || "Gagal download file", { id: toastId });
      } else if (e instanceof Error) {
        toast.error(e.message || "Gagal download file", { id: toastId });
      } else {
        toast.error("Gagal download file", { id: toastId });
      }
=======
      // Delay revoke supaya browser sempat trigger download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      setError(e?.detail || "Gagal download");
      setTimeout(() => setError(null), 3000);
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] font-semibold text-[var(--y-text)] transition-colors hover:bg-[var(--y-bg-hover)] disabled:opacity-60"
<<<<<<< HEAD
      title="Download"
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Download size={15} />
      )}
      <span className="hidden sm:inline">Download</span>
=======
      title={error || "Download"}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
      <span className="hidden sm:inline">{error || "Download"}</span>
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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
<<<<<<< HEAD
  const setView = useYudit((s) => s.setView);
  const closePreview = useYudit((s) => s.closePreview);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PreviewError | null>(null);
=======
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9

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
<<<<<<< HEAD
      } catch (e) {
        if (!cancelled) {
          setError(toPreviewError(e));
=======
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.detail || "Gagal memuat preview");
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
<<<<<<< HEAD
=======
      // Jangan revoke terlalu cepat — biarkan browser pakai dulu
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
      if (url) setTimeout(() => URL.revokeObjectURL(url!), 500);
    };
  }, [file.id]);

<<<<<<< HEAD
  // Loading
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 text-[var(--y-text-dim)]">
        <Loader2 size={32} className="animate-spin text-[var(--y-primary)]" />
        <div className="text-sm">Memuat preview…</div>
      </div>
    );
  }

<<<<<<< HEAD
  // Error state
  if (error) {
    return (
      <PreviewErrorView
        error={error}
        onReconnect={() => {
          closePreview();
          setView("drives");
        }}
      />
    );
  }

  if (!blobUrl) {
    return (
      <div className="text-center">
        <FileQuestion
          size={80}
          className="mx-auto mb-3 text-[var(--y-text-mute)]"
        />
        <div className="mb-1 text-base font-semibold text-[var(--y-text)]">
          Preview tidak tersedia
=======
  if (error || !blobUrl) {
    return (
      <div className="text-center">
        <FileQuestion size={80} className="mx-auto mb-3 text-[var(--y-text-mute)]" />
        <div className="mb-1 text-base font-semibold text-[var(--y-text)]">
          {error || "Preview tidak tersedia"}
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
        </div>
        <div className="text-xs text-[var(--y-text-dim)]">
          Klik "Download" untuk mengunduh file
        </div>
      </div>
    );
  }

  return <PreviewContent file={file} url={blobUrl} />;
}

<<<<<<< HEAD
// =====================================================
// ERROR VIEW
// =====================================================
function PreviewErrorView({
  error,
  onReconnect,
}: {
  error: PreviewError;
  onReconnect: () => void;
}) {
  // ⭐ FIX: 403 = permission denied (BUKAN drive error).
  //    Drive error selalu ditandai dengan `isDriveError` flag
  //    dari interceptor (yang sudah CORS-safe via message detection).
  const isDriveError = error.isDriveError === true;

  return (
    <div className="mx-auto max-w-md text-center">
      <div
        className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl ${
          isDriveError
            ? "bg-[rgba(245,158,11,0.15)]"
            : "bg-[rgba(239,68,68,0.15)]"
        }`}
      >
        {isDriveError ? (
          <AlertTriangle size={32} className="text-[var(--y-warn)]" />
        ) : (
          <FileQuestion size={32} className="text-[var(--y-danger)]" />
        )}
      </div>
      <h3 className="mb-2 text-base font-semibold text-[var(--y-text)]">
        {isDriveError
          ? error.driveEmail
            ? `Google Drive ${error.driveEmail} Perlu Reconnect`
            : "Google Drive Tidak Valid"
          : "Gagal Memuat File"}
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-[var(--y-text-dim)]">
        {error.message}
      </p>
      {isDriveError && (
        <button
          onClick={onReconnect}
          className="y-gradient-brand y-glow-primary inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
        >
          <RefreshCw size={15} />
          Buka Menu Google Drive
        </button>
      )}
    </div>
  );
}

// =====================================================
// PREVIEW CONTENT
// =====================================================
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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

<<<<<<< HEAD
=======
  // Image
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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

<<<<<<< HEAD
=======
  // Video
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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

<<<<<<< HEAD
=======
  // Audio
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  if (mime.startsWith("audio/") || ["mp3", "wav", "flac", "m4a"].includes(ext)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-8">
          <div className="mb-4 flex justify-center">
<<<<<<< HEAD
            <info.Icon
              size={64}
              style={{ color: info.color }}
              strokeWidth={1.5}
            />
=======
            <info.Icon size={64} style={{ color: info.color }} strokeWidth={1.5} />
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
          </div>
          <audio src={url} controls className="w-full" />
        </div>
      </motion.div>
    );
  }

<<<<<<< HEAD
=======
  // PDF
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  if (ext === "pdf") {
    return (
      <iframe
        src={url}
        className="h-[80vh] w-full max-w-4xl rounded-xl border border-[var(--y-border)] bg-white"
        title={file.name}
      />
    );
  }

<<<<<<< HEAD
  if (
    [
      "txt",
      "md",
      "json",
      "csv",
      "xml",
      "log",
      "py",
      "js",
      "ts",
      "html",
      "css",
    ].includes(ext)
=======
  // Text / code
  if (
    ["txt", "md", "json", "csv", "xml", "log", "py", "js", "ts", "html", "css"].includes(ext)
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  ) {
    return <TextPreview url={url} name={file.name} />;
  }

<<<<<<< HEAD
  return (
    <div className="text-center">
      <FileQuestion
        size={80}
        className="mx-auto mb-3 text-[var(--y-text-mute)]"
      />
=======
  // Fallback
  return (
    <div className="text-center">
      <FileQuestion size={80} className="mx-auto mb-3 text-[var(--y-text-mute)]" />
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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