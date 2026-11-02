// src/components/yudit/ui/file-row.tsx
"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Share2,
  Download,
  Trash2,
  Loader2,
  Pencil,
  Lock,
  ChevronDown,
  FileText,
  FileSearch,
  UserPlus,
  Users,
  PencilLine,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createPortal } from "react-dom";

import { DocEditor } from "../editor/doc-editor";
import { GoogleDocViewer } from "../editor/google-doc-viewer";
import { DocPreviewViewer } from "../editor/doc-preview-viewer";
import type { FileItem, EditorMode, User } from "@/lib/yudit/types";
import { formatBytes, formatDate, extOf } from "@/lib/yudit/utils";
import { useYudit, canManageWorkspace } from "@/lib/yudit/store";
import { fetchFileBlob } from "@/lib/api/files";
import { ApiError } from "@/lib/api/client";
import { FileIcon } from "./file-icon";
import { CategoryBadge } from "./category-badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// =====================================================
// GRID CONSTANT — SAMA PERSIS dengan header FilesView
// =====================================================
const GRID_CLASSNAME = cn(
  "grid items-center gap-2 sm:gap-3 rounded-xl border border-transparent",
  "px-2 sm:px-3 py-2.5 transition-colors",
  "hover:border-[var(--y-border-soft)] hover:bg-[var(--y-bg-hover)]",
  "grid-cols-[44px_minmax(0,1fr)_auto]",
  "sm:grid-cols-[44px_minmax(0,1fr)_80px_140px]",
  "lg:grid-cols-[44px_minmax(0,1fr)_100px_160px_200px]",
);

// =====================================================
// HELPERS
// =====================================================
function isDocxFile(file: FileItem): boolean {
  const ext = extOf(file.name);
  if (ext !== "docx") return false;
  const mime = file.mime_type || "";
  return (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword" ||
    mime === ""
  );
}

function canEditFile(file: FileItem, user: User | null): boolean {
  if (!user) return false;
  if (!isDocxFile(file)) return false;
  if (user.role === "owner" || user.role === "super_admin") return true;
  return file.can_edit_to_me !== false;
}

function canDeleteFile(file: FileItem, user: User | null): boolean {
  if (!user) return false;
  if (user.role === "owner" || user.role === "super_admin") return true;
  return file.can_delete_to_me === true;
}

function canShareFile(_file: FileItem, user: User | null): boolean {
  if (!user) return false;
  return true;
}

// =====================================================
// PROPS
// =====================================================
interface FileRowProps {
  file: FileItem;
  index?: number;
  showFolder?: boolean;
  alwaysShowActions?: boolean;
  assignmentCount?: number;
}

// =====================================================
// FILE ROW
// =====================================================
export function FileRow({
  file,
  index = 0,
  showFolder = false,
  alwaysShowActions = false,
  assignmentCount = 0,
}: FileRowProps) {
  const openPreview = useYudit((s) => s.openPreview);
  const openShare = useYudit((s) => s.openShare);
  const openAssignModal = useYudit((s) => s.openAssignModal);
  const showConfirm = useYudit((s) => s.showConfirm);
  const deleteFile = useYudit((s) => s.deleteFile);
  const fetchFiles = useYudit((s) => s.fetchFiles);
  const setView = useYudit((s) => s.setView);
  const user = useYudit((s) => s.user);

  const [downloading, setDownloading] = useState(false);
  const [editingMode, setEditingMode] = useState<EditorMode | null>(null);

  const isManager = canManageWorkspace(user);
  const canEdit = canEditFile(file, user);
  const canDelete = canDeleteFile(file, user);
  const canShare = canShareFile(file, user);
  const isDocx = isDocxFile(file);
  const isPdf = extOf(file.name) === "pdf";
  const isAssignedToSomeone = assignmentCount > 0;

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleDelete = () => {
    showConfirm(
      "Hapus file?",
      "File akan dihapus permanen dari penyimpanan.",
      () => {
        deleteFile(file.id);
      },
    );
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
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success(`"${file.name}" berhasil diunduh`, { id: toastId });
    } catch (e) {
      if (e instanceof ApiError && e.isDriveError) {
        const email = e.driveEmail || "Google Drive";
        toast.error(
          `${email} perlu di-reconnect. Buka menu "Google Drive" untuk memperbaiki.`,
          {
            id: toastId,
            duration: 10000,
            action: {
              label: "Buka Drives",
              onClick: () => setView("drives"),
            },
          },
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
      } else if (e instanceof ApiError && e.status === 404) {
        toast.error(
          "File tidak ditemukan di Google Drive (mungkin sudah dihapus).",
          { id: toastId },
        );
      } else {
        const msg = e instanceof ApiError ? e.detail : "Gagal download file";
        toast.error(msg, { id: toastId });
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleEditLocal = () => {
    if (!isDocx) {
      toast.error("Hanya file .docx yang bisa diedit");
      return;
    }
    if (user?.role === "member" && file.can_edit_to_me === false) {
      toast.error(
        "Anda tidak punya izin edit dokumen ini. " +
          "Minta owner untuk assign dokumen ke Anda.",
      );
      return;
    }
    setEditingMode("local");
  };

  const handleEditGoogleDocs = () => {
    if (!isDocx) {
      toast.error("Hanya file .docx yang bisa di-convert ke Google Docs");
      return;
    }
    setEditingMode("google_docs");
  };

  const handlePreviewFull = () => {
    if (!isDocx) {
      toast.error("Hanya file .docx yang bisa di-preview");
      return;
    }
    setEditingMode("preview");
  };

  const handleCloseEditor = () => {
    setEditingMode(null);
    fetchFiles();
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.2,
          delay: Math.min(index * 0.015, 0.2),
        }}
        className={cn("group", GRID_CLASSNAME)}
      >
        {/* Kolom 1: Icon */}
        <button
          onClick={() => openPreview(file.id)}
          className="flex items-center justify-center"
          title="Preview"
        >
          <FileIcon mime={file.mime_type || ""} name={file.name} />
        </button>

        {/* Kolom 2: Name + Meta inline (mobile) */}
        <button
          onClick={() => openPreview(file.id)}
          className="flex min-w-0 flex-col text-left"
          title={file.name}
        >
          <span className="truncate text-sm font-medium text-[var(--y-text)] transition-colors group-hover:text-[var(--y-primary)]">
            {file.name}
          </span>

          {showFolder && file.folder_name && (
            <span className="text-[10px] text-[var(--y-text-mute)]">
              📅 {file.folder_name}
            </span>
          )}

          {/* ⭐ Meta inline — hanya tampil di mobile (kolom Size & Category disembunyikan) */}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 sm:hidden">
            <span className="text-[10px] tabular-nums text-[var(--y-text-mute)]">
              {formatBytes(file.size)}
            </span>
            {file.category && (
              <>
                <span className="text-[10px] text-[var(--y-text-mute)]">•</span>
                <CategoryBadge category={file.category} />
              </>
            )}
          </div>

          {/* Badges: Google Docs & Assigned */}
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {file.google_doc_id && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[rgba(66,133,244,0.15)] px-1.5 py-0.5 text-[9px] font-semibold text-[#4285f4]">
                <FileText size={8} />
                Google Docs
              </span>
            )}
            {isAssignedToSomeone && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[rgba(168,85,247,0.15)] px-1.5 py-0.5 text-[9px] font-semibold text-[#a855f7]">
                <Users size={8} />
                {assignmentCount} assigned
              </span>
            )}
          </div>
        </button>

        {/* Kolom 3: Size — tablet & desktop */}
        <div className="hidden text-xs tabular-nums text-[var(--y-text-dim)] sm:block sm:text-right">
          {formatBytes(file.size)}
        </div>

        {/* Kolom 4: Category — desktop only */}
        <div className="hidden min-w-0 lg:block">
          <CategoryBadge category={file.category} />
        </div>

        {/* Kolom 5 (desktop) / Kolom 3 (tablet) / Kolom 3 (mobile): Actions */}
        <div className="file-row-actions-wrapper">
          {/* ⭐ Actions — behavior ditentukan CSS @media(hover) */}
          <div
            className={cn(
              "file-row-actions",
              alwaysShowActions && "always-show",
            )}
          >
            {canEdit && isDocx && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    title="Edit / Assign Dokumen"
                    className="flex h-7 items-center gap-0.5 rounded-md px-1.5 text-[var(--y-primary)] transition-colors hover:bg-[rgba(239,68,68,0.15)]"
                  >
                    <Pencil size={14} />
                    <ChevronDown size={10} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-[var(--y-text-mute)]">
                    Pilih Mode Editor
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleEditLocal}
                    className="gap-2.5 py-2"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgba(239,68,68,0.15)]">
                      <PencilLine
                        size={15}
                        className="text-[var(--y-primary)]"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--y-text)]">
                        Edit Cepat
                      </div>
                      <div className="text-[10px] text-[var(--y-text-mute)]">
                        Format dasar, autosave 1.5s
                      </div>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleEditGoogleDocs}
                    className="gap-2.5 py-2"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgba(66,133,244,0.15)]">
                      <FileText size={15} className="text-[#4285f4]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--y-text)]">
                        Google Docs
                        <span className="rounded-full bg-[rgba(16,185,129,0.15)] px-1.5 py-0.5 text-[8px] font-bold text-[#10b981]">
                          NATIVE
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--y-text-mute)]">
                        Full fitur, fidelity 100%
                      </div>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handlePreviewFull}
                    className="gap-2.5 py-2"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgba(249,115,22,0.15)]">
                      <FileSearch
                        size={15}
                        className="text-[var(--y-accent)]"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--y-text)]">
                        Preview Asli
                      </div>
                      <div className="text-[10px] text-[var(--y-text-mute)]">
                        Lihat persis seperti Word
                      </div>
                    </div>
                  </DropdownMenuItem>

                  {isManager && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openAssignModal(file.id)}
                        className="gap-2.5 py-2"
                      >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgba(168,85,247,0.15)]">
                          <UserPlus size={15} className="text-[#a855f7]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[var(--y-text)]">
                            Assign ke Collaborator
                          </div>
                          <div className="text-[10px] text-[var(--y-text-mute)]">
                            {isAssignedToSomeone
                              ? `${assignmentCount} collaborator bisa edit`
                              : "Pilih siapa yang bisa edit dokumen ini"}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!isDocx && isPdf && (
              <span
                title="PDF tidak bisa diedit langsung. Convert ke Word dulu via menu Konversi."
                className="grid h-7 w-7 place-items-center rounded-md text-[var(--y-text-mute)] opacity-50"
              >
                <Lock size={13} />
              </span>
            )}

            <IconBtn label="Preview" onClick={() => openPreview(file.id)}>
              <Eye size={14} />
            </IconBtn>

            {canShare && (
              <IconBtn label="Bagikan" onClick={() => openShare(file.id)}>
                <Share2 size={14} />
              </IconBtn>
            )}

            <IconBtn label="Download" onClick={handleDownload}>
              {downloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
            </IconBtn>

            {canDelete && (
              <IconBtn label="Hapus" danger onClick={handleDelete}>
                <Trash2 size={14} />
              </IconBtn>
            )}
          </div>

          {/* ⭐ Date — desktop/mouse-only, auto-hidden saat hover / always-show */}
          <span className="file-row-date">{formatDate(file.created_at)}</span>
        </div>
      </motion.div>

      {/* Editor Portals */}
      {editingMode &&
        typeof window !== "undefined" &&
        createPortal(
          <>
            {editingMode === "local" && (
              <DocEditor
                fileId={file.id}
                fileName={file.name}
                onClose={handleCloseEditor}
              />
            )}
            {editingMode === "google_docs" && (
              <GoogleDocViewer
                fileId={file.id}
                fileName={file.name}
                existingDocId={file.google_doc_id}
                onClose={handleCloseEditor}
                onSyncBack={() => {
                  toast.success("Berhasil sync ke .docx");
                  fetchFiles();
                }}
              />
            )}
            {editingMode === "preview" && (
              <DocPreviewViewer
                fileId={file.id}
                fileName={file.name}
                onClose={handleCloseEditor}
              />
            )}
          </>,
          document.body,
        )}
    </>
  );
}

// =====================================================
// ICON BUTTON
// =====================================================
function IconBtn({
  children,
  onClick,
  danger,
  accent,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  accent?: boolean;
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
        accent &&
          "text-[var(--y-primary)] hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-primary)]",
        danger &&
          "hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-danger)]",
      )}
    >
      {children}
    </button>
  );
}