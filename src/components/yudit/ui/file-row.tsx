// src/components/yudit/ui/file-row.tsx
"use client";

import { motion } from "framer-motion";
import { Eye, Share2, Download, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { FileItem } from "@/lib/yudit/types";
import { formatBytes, formatDate } from "@/lib/yudit/utils";
import { useYudit } from "@/lib/yudit/store";
import { fetchFileBlob } from "@/lib/api/files";
import { FileIcon } from "./file-icon";
import { CategoryBadge } from "./category-badge";
import { cn } from "@/lib/utils";

interface FileRowProps {
  file: FileItem;
  index?: number;
  showFolder?: boolean;
  alwaysShowActions?: boolean;
}

export function FileRow({
  file,
  index = 0,
  showFolder = false,
  alwaysShowActions = false,
}: FileRowProps) {
  const openPreview = useYudit((s) => s.openPreview);
  const openShare = useYudit((s) => s.openShare);
  const showConfirm = useYudit((s) => s.showConfirm);
  const deleteFile = useYudit((s) => s.deleteFile);
  const [downloading, setDownloading] = useState(false);

  const handleDelete = () => {
    showConfirm("Hapus file?", "File akan dihapus permanen dari penyimpanan.", () => {
      deleteFile(file.id);
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    const toastId = toast.loading(`Mengunduh ${file.name}…`);
    try {
      const blob = await fetchFileBlob(file.id, "download");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Delay revoke
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success(`"${file.name}" berhasil diunduh`, { id: toastId });
    } catch (e: any) {
      toast.error(e?.detail || "Gagal download file", { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.2) }}
      className={cn(
        "group grid items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors",
        "hover:border-[var(--y-border-soft)] hover:bg-[rgba(22,31,63,0.6)]",
      )}
      style={{ gridTemplateColumns: "44px 1fr 90px 150px 120px" }}
    >
      <button
        onClick={() => openPreview(file.id)}
        className="flex items-center justify-center"
        title="Preview"
      >
        <FileIcon mime={file.mime_type || ""} name={file.name} />
      </button>

      <button
        onClick={() => openPreview(file.id)}
        className="flex min-w-0 flex-col text-left"
        title={file.name}
      >
        <span className="truncate text-sm font-medium text-[var(--y-text)] group-hover:text-[var(--y-primary)] transition-colors">
          {file.name}
        </span>
        {showFolder && file.folder_name && (
          <span className="text-[10px] text-[var(--y-text-mute)]">
            📅 {file.folder_name}
          </span>
        )}
      </button>

      <div className="text-xs tabular-nums text-[var(--y-text-dim)]">
        {formatBytes(file.size)}
      </div>

      <div className="min-w-0">
        <CategoryBadge category={file.category} />
      </div>

      <div className="flex items-center justify-end gap-1">
        <div
          className={cn(
            "flex items-center gap-0.5",
            alwaysShowActions
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 transition-opacity",
          )}
        >
          <IconBtn label="Preview" onClick={() => openPreview(file.id)}>
            <Eye size={14} />
          </IconBtn>
          <IconBtn label="Bagikan" onClick={() => openShare(file.id)}>
            <Share2 size={14} />
          </IconBtn>
          <IconBtn label="Download" onClick={handleDownload}>
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
          </IconBtn>
          <IconBtn label="Hapus" danger onClick={handleDelete}>
            <Trash2 size={14} />
          </IconBtn>
        </div>
        <span className="text-[11px] tabular-nums text-[var(--y-text-mute)] group-hover:hidden pl-2">
          {formatDate(file.created_at)}
        </span>
      </div>
    </motion.div>
  );
}

function IconBtn({
  children,
  onClick,
  danger,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={label}
      aria-label={label}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md text-[var(--y-text-dim)] transition-colors",
        "hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
        danger && "hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-danger)]",
      )}
    >
      {children}
    </button>
  );
}