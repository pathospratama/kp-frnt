// src/app/share/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  Loader2,
  Lock,
  FileQuestion,
  Eye,
  Calendar,
  HardDrive,
  Cloud,
} from "lucide-react";

import {
  getShareInfo,
  getSharePreviewUrl,
  getShareDownloadUrl,
  type ShareInfo,
} from "@/lib/api/share";
import { formatBytes, formatDate, fileIconInfo } from "@/lib/yudit/utils";
import { FileIcon } from "@/components/yudit/ui/file-icon";

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  // =====================================================
  // FETCH INFO
  // =====================================================
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getShareInfo(token);
        if (cancelled) return;
        setInfo(res);
        if (!res.has_password) setUnlocked(true);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.detail || "Link tidak valid atau sudah dicabut");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // =====================================================
  // SUBMIT PASSWORD
  // =====================================================
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;
    setPasswordError(null);

    // Coba fetch info dengan password — kalau sukses, unlock
    try {
      const url = getSharePreviewUrl(token, password);
      const res = await fetch(url, { method: "HEAD" });
      // Kalau backend return 403 → password salah
      if (res.status === 403) {
        setPasswordError("Password salah");
        return;
      }
      if (!res.ok) {
        setPasswordError("Gagal membuka file");
        return;
      }
      setUnlocked(true);
    } catch {
      setPasswordError("Gagal verifikasi password");
    }
  };

  // =====================================================
  // DOWNLOAD
  // =====================================================
  const handleDownload = () => {
    if (!token || !info) return;
    const url = getShareDownloadUrl(token, password || undefined);
    // Trigger browser download
    const a = document.createElement("a");
    a.href = url;
    a.download = info.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // =====================================================
  // RENDER STATES
  // =====================================================

  // Loading
  if (loading) {
    return (
      <div className="yudit-ambient grid min-h-screen place-items-center p-5">
        <Loader2 size={32} className="animate-spin text-[var(--y-primary)]" />
      </div>
    );
  }

  // Error (invalid/expired/revoked)
  if (error || !info) {
    return (
      <div className="yudit-ambient grid min-h-screen place-items-center p-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="y-glass-strong y-glow-soft w-full max-w-md rounded-3xl border border-[var(--y-border)] p-8 text-center"
        >
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[rgba(239,68,68,0.15)]">
            <FileQuestion size={28} className="text-[var(--y-danger)]" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-[var(--y-text)]">
            Link Tidak Valid
          </h1>
          <p className="text-sm text-[var(--y-text-dim)]">
            {error || "Link mungkin sudah dicabut, kedaluwarsa, atau salah."}
          </p>
        </motion.div>
      </div>
    );
  }

  const ext = info.name.split(".").pop()?.toLowerCase() || "";
  const iconInfo = fileIconInfo(info.mime_type || "", info.name);
  const isImage =
    info.mime_type?.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
  const isVideo =
    info.mime_type?.startsWith("video/") ||
    ["mp4", "webm", "mov", "mkv"].includes(ext);
  const isAudio =
    info.mime_type?.startsWith("audio/") ||
    ["mp3", "wav", "flac", "m4a"].includes(ext);
  const isPdf = ext === "pdf";
  const canPreview = isImage || isVideo || isAudio || isPdf;

  return (
    <div className="yudit-ambient min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-2.5"
        >
          <div className="y-gradient-brand y-glow-primary grid h-9 w-9 place-items-center rounded-xl">
            <Cloud size={20} className="text-white" fill="currentColor" />
          </div>
          <div className="text-[18px] font-bold tracking-tight text-[var(--y-text)]">
            Yudit<span className="y-gradient-text">Cloud</span>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="y-glass-strong y-glow-soft overflow-hidden rounded-3xl border border-[var(--y-border)]"
        >
          {/* File header */}
          <div className="border-b border-[var(--y-border)] p-5">
            <div className="flex items-start gap-4">
              <FileIcon mime={info.mime_type || ""} name={info.name} size={28} />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-semibold text-[var(--y-text)]">
                  {info.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--y-text-dim)]">
                  <span className="inline-flex items-center gap-1">
                    <HardDrive size={12} />
                    {formatBytes(info.size)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(info.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye size={12} />
                    {info.views} views
                  </span>
                  {info.has_password && (
                    <span className="inline-flex items-center gap-1 text-[var(--y-warn)]">
                      <Lock size={12} />
                      Terproteksi
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Password gate */}
          {info.has_password && !unlocked ? (
            <form onSubmit={handleUnlock} className="p-6">
              <div className="mb-4 flex items-center gap-2 text-sm text-[var(--y-text-dim)]">
                <Lock size={16} className="text-[var(--y-warn)]" />
                File ini dilindungi password
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoFocus
                  className="y-focus h-10 flex-1 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm text-[var(--y-text)] placeholder:text-[var(--y-text-mute)] outline-none"
                />
                <button
                  type="submit"
                  className="y-gradient-brand y-glow-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
                >
                  Buka
                </button>
              </div>
              {passwordError && (
                <div className="mt-2 text-xs text-[var(--y-danger)]">{passwordError}</div>
              )}
            </form>
          ) : (
            <>
              {/* Preview area */}
              <div className="border-b border-[var(--y-border)] bg-[rgba(0,0,0,0.3)] p-4">
                {canPreview ? (
                  <PreviewArea
                    token={token!}
                    password={password || undefined}
                    isImage={isImage}
                    isVideo={isVideo}
                    isAudio={isAudio}
                    isPdf={isPdf}
                    name={info.name}
                    iconInfo={iconInfo}
                  />
                ) : (
                  <div className="grid place-items-center py-12 text-center">
                    <div
                      className="mb-3 grid h-20 w-20 place-items-center rounded-2xl"
                      style={{ background: iconInfo.bg }}
                    >
                      <iconInfo.Icon
                        size={40}
                        style={{ color: iconInfo.color }}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="text-sm text-[var(--y-text-dim)]">
                      Preview tidak tersedia untuk tipe ini
                    </div>
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between gap-3 p-5">
                <div className="text-xs text-[var(--y-text-mute)]">
                  Dibagikan via Yudit Cloud
                </div>
                <button
                  onClick={handleDownload}
                  className="y-gradient-brand y-glow-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[var(--y-text-mute)]">
          © {new Date().getFullYear()} Yudit Cloud — Satu cloud, banyak Drive
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PREVIEW AREA
// =====================================================
function PreviewArea({
  token,
  password,
  isImage,
  isVideo,
  isAudio,
  isPdf,
  name,
  iconInfo,
}: {
  token: string;
  password?: string;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isPdf: boolean;
  name: string;
  iconInfo: ReturnType<typeof fileIconInfo>;
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
        const previewUrl = getSharePreviewUrl(token, password);
        const res = await fetch(previewUrl);
        if (!res.ok) {
          throw new Error(
            res.status === 403
              ? "Password salah"
              : res.status === 410
                ? "Link sudah kedaluwarsa"
                : "Gagal memuat file",
          );
        }
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        if (!cancelled) {
          setBlobUrl(url);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Gagal memuat preview");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [token, password]);

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 size={28} className="animate-spin text-[var(--y-primary)]" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="grid place-items-center py-12 text-center">
        <FileQuestion size={40} className="mb-2 text-[var(--y-text-mute)]" />
        <div className="text-sm text-[var(--y-text-dim)]">
          {error || "Preview tidak tersedia"}
        </div>
      </div>
    );
  }

  if (isImage) {
    return (
      <img
        src={blobUrl}
        alt={name}
        className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain"
      />
    );
  }

  if (isVideo) {
    return (
      <video
        src={blobUrl}
        controls
        autoPlay
        className="mx-auto aspect-video max-h-[70vh] w-full rounded-lg bg-black"
      />
    );
  }

  if (isAudio) {
    return (
      <div className="py-8">
        <div className="mb-4 flex justify-center">
          <iconInfo.Icon size={64} style={{ color: iconInfo.color }} strokeWidth={1.5} />
        </div>
        <audio src={blobUrl} controls className="mx-auto w-full max-w-md" />
      </div>
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={blobUrl}
        title={name}
        className="h-[70vh] w-full rounded-lg bg-white"
      />
    );
  }

  return null;
}