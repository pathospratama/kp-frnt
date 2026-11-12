// src/components/yudit/modals/create-folder-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderPlus, X, Loader2, Folder } from "lucide-react";
import { toast } from "sonner";

import { createFolder } from "@/lib/api/folders";
import { useYudit } from "@/lib/yudit/store";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface CreateFolderModalProps {
  open: boolean;
  parentId?: string | null;
  onClose: () => void;
  onCreated: (folderId: string) => void;
}

export function CreateFolderModal({
  open, parentId, onClose, onCreated,
}: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nama folder wajib diisi");
      return;
    }
    if (trimmed.length > 200) {
      setError("Nama folder terlalu panjang (maks 200 karakter)");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await createFolder({
        name: trimmed,
        parent_id: parentId || null,
      });
      toast.success(`Folder "${trimmed}" berhasil dibuat`);
      onCreated(res.folder.id);
      onClose();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.detail
          : e instanceof Error
            ? e.message
            : "Gagal membuat folder";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[998] grid place-items-center p-5"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="y-glass-strong y-glow-soft w-full max-w-[420px] rounded-2xl border border-[var(--y-border)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[rgba(245,158,11,0.15)]">
                <FolderPlus size={20} className="text-[var(--y-warn)]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-[var(--y-text)]">
                  Buat Folder Baru
                </h3>
                <p className="text-[12px] text-[var(--y-text-dim)]">
                  Kelompokkan dokumen Anda dalam folder
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-[var(--y-text-mute)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-dim)]">
                  Nama Folder
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] group-focus-within:text-[var(--y-primary)]">
                    <Folder size={15} />
                  </div>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Contoh: Dokumen-Arsip"
                    autoFocus
                    maxLength={200}
                    className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] pl-10 pr-4 text-sm text-[var(--y-text)] placeholder:text-[var(--y-text-mute)]"
                  />
                </div>
                {error && (
                  <div className="mt-1.5 text-[11px] text-[var(--y-danger)]">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-4 text-sm font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className={cn(
                    "y-gradient-brand inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white",
                    "disabled:opacity-60",
                  )}
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FolderPlus size={14} />
                  )}
                  Buat Folder
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
