// src/components/yudit/modals/share-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Link2,
  Copy,
  Check,
  ShieldCheck,
  Trash2,
  Clock,
  Eye,
  Loader2,
} from "lucide-react";

import { useYudit } from "@/lib/yudit/store";
import { formatBytes } from "@/lib/yudit/utils";
import { getShareUrl } from "@/lib/api/share";
import { FileIcon } from "../ui/file-icon";

export function ShareModal() {
  const shareFileId = useYudit((s) => s.shareFileId);
  const closeShare = useYudit((s) => s.closeShare);
  const files = useYudit((s) => s.files);
  const file = files.find((f) => f.id === shareFileId) || null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && shareFileId) closeShare();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shareFileId, closeShare]);

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[998] grid place-items-center p-5"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={closeShare}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="y-glass-strong y-glow-soft w-full max-w-[500px] rounded-2xl border border-[var(--y-border)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <ShareForm key={file.id} file={file} onClose={closeShare} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShareForm({
  file,
  onClose,
}: {
  file: {
    id: string;
    name: string;
    mime_type: string | null;
    size: number;
    is_public: boolean;
    share_token: string | null;
    share_views: number;
    share_expires_at?: string | null;
  };
  onClose: () => void;
}) {
  const createShare = useYudit((s) => s.createShare);
  const revokeShare = useYudit((s) => s.revokeShare);
  const showConfirm = useYudit((s) => s.showConfirm);

  const [expires, setExpires] = useState("168");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createShare({
        expires_hours: expires ? parseInt(expires) : null,
        password: password.trim() || null,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (!file.share_token) return;
    const url = getShareUrl(file.share_token);
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = () => {
    showConfirm("Cabut share?", "Link yang sudah dibagikan tidak akan bisa diakses lagi.", async () => {
      await revokeShare(file.id);
      onClose();
    });
  };

  return (
    <>
      <div className="mb-5 flex items-start gap-3">
        <div className="y-gradient-brand y-glow-primary grid h-11 w-11 shrink-0 place-items-center rounded-xl">
          <Link2 size={20} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-[var(--y-text)]">Bagikan File</h3>
          <div className="mt-1.5 flex items-center gap-2">
            <FileIcon mime={file.mime_type || ""} name={file.name} size={16} />
            <span className="truncate text-xs text-[var(--y-text-dim)]">
              {file.name} • {formatBytes(file.size)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--y-text-mute)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
        >
          <X size={16} />
        </button>
      </div>

      {file.is_public && file.share_token ? (
        <div className="mb-4">
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.1)] px-3 py-2.5">
            <ShieldCheck size={16} className="shrink-0 text-[var(--y-success)]" />
            <span className="text-[13px] text-[#34d399]">
              File ini sudah dibagikan. Salin link di bawah.
            </span>
          </div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[var(--y-text-mute)]">
            <Eye size={12} />
            <span>{file.share_views} views</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="y-focus flex-1 overflow-x-auto rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 py-2.5 font-mono text-[12px] text-[var(--y-accent)]">
              {getShareUrl(file.share_token)}
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] font-semibold text-[var(--y-text)] transition-colors hover:bg-[var(--y-bg-hover)]"
            >
              {copied ? (
                <Check size={15} className="text-[var(--y-success)]" />
              ) : (
                <Copy size={15} />
              )}
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleRevoke}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[rgba(239,68,68,0.1)] px-3 text-[13px] font-semibold text-[var(--y-danger)] transition-colors hover:bg-[rgba(239,68,68,0.2)]"
            >
              <Trash2 size={14} />
              Cabut Share
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 space-y-3">
            <ShareOption icon={<Clock size={15} />} label="Kedaluwarsa">
              <select
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
                className="y-focus h-9 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[13px] text-[var(--y-text)] outline-none"
              >
                <option value="">Tidak kedaluwarsa</option>
                <option value="24">24 jam</option>
                <option value="168">7 hari</option>
                <option value="720">30 hari</option>
              </select>
            </ShareOption>
            <ShareOption icon={<ShieldCheck size={15} />} label="Password">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kosongkan jika tidak perlu"
                className="y-focus h-9 flex-1 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[13px] text-[var(--y-text)] placeholder:text-[var(--y-text-mute)] outline-none"
              />
            </ShareOption>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="y-gradient-brand y-glow-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              {creating ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
              Buat Link
            </button>
          </div>
        </>
      )}
    </>
  );
}

function ShareOption({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex w-[110px] shrink-0 items-center gap-2 text-[13px] font-semibold text-[var(--y-text-dim)]">
        <span className="text-[var(--y-text-mute)]">{icon}</span>
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}