// src/components/yudit/editor/doc-editor.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";

import { motion } from "framer-motion";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Code,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  History,
  X,
  Highlighter,
  RefreshCw,
  FileWarning,
} from "lucide-react";
import { toast } from "sonner";

import { useDocEditor } from "@/hooks/use-doc-editor";
import {
  uploadDocImage,
  listDocVersions,
  restoreDocVersion,
  openDoc,
  type DocVersion,
} from "@/lib/api/docs";
import { useYudit } from "@/lib/yudit/store";
import { cn } from "@/lib/utils";

// =====================================================
// PROPS
// =====================================================
interface DocEditorProps {
  fileId: string;
  fileName?: string;
  onClose: () => void;
}

// =====================================================
// MAIN COMPONENT
// =====================================================
export function DocEditor({ fileId, fileName, onClose }: DocEditorProps) {
  const { doc, loading, error, saveState, queueSave, saveNow, reload } =
    useDocEditor(fileId);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const setView = useYudit((s) => s.setView);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // ✅ StarterKit — disable link & underline karena ada manual
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: false,
        underline: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-500 underline" },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: true, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Mulai menulis…",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none focus:outline-none min-h-[600px]",
      },
    },
    onUpdate: ({ editor }) => {
      queueSave(editor.getHTML());
    },
  });

  // ---- Set initial content ----
  useEffect(() => {
    if (editor && doc?.html && editor.getHTML() === "<p></p>") {
      editor.commands.setContent(doc.html);
    }
  }, [editor, doc]);

  // ---- Ctrl+S handler ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (editor) {
          saveNow(editor.getHTML());
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editor, saveNow]);

  // ---- Load versions ----
  const openHistory = useCallback(async () => {
    setHistoryOpen(true);
    try {
      const vs = await listDocVersions(fileId);
      setVersions(vs);
    } catch {
      toast.error("Gagal memuat riwayat");
    }
  }, [fileId]);

  const handleRestore = async (versionNumber: number) => {
    try {
      await restoreDocVersion(fileId, versionNumber);
      toast.success(`Versi ${versionNumber} berhasil dipulihkan`);
      const res = await openDoc(fileId);
      editor?.commands.setContent(res.html);
      setHistoryOpen(false);
    } catch {
      toast.error("Gagal restore versi");
    }
  };

  // ---- Image upload ----
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = "";

    const toastId = toast.loading("Mengunggah gambar…");
    try {
      const { url } = await uploadDocImage(fileId, file);
      editor.chain().focus().setImage({ src: url }).run();
      toast.success("Gambar disisipkan", { id: toastId });
    } catch {
      toast.error("Gagal upload gambar", { id: toastId });
    }
  };

  const displayName = doc?.file.name || fileName || "Dokumen";

  // =====================================================
  // RENDER: LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="fixed inset-0 z-[2000] grid place-items-center bg-black/80 backdrop-blur">
        <div className="text-center text-white">
          <Loader2
            size={40}
            className="mx-auto animate-spin text-[var(--y-primary)]"
          />
          <div className="mt-4 text-sm">Memuat dokumen…</div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: ERROR
  // =====================================================
  if (error || !doc) {
    // ✅ error sekarang object: { message, status, isAuthError }
    const isAuthError = error?.isAuthError ?? false;
    const errorMessage =
      error?.message || "Terjadi kesalahan saat memuat dokumen.";
    const errorStatus = error?.status ?? 0;

    // Icon & title berdasarkan jenis error
    const errorTitle = (() => {
      if (isAuthError) return "Google Drive Tidak Valid";
      if (errorStatus === 403) return "Akses Ditolak";
      if (errorStatus === 400) return "File Tidak Bisa Diedit";
      if (errorStatus >= 500) return "Server Error";
      return "Gagal Membuka Dokumen";
    })();

    const iconBg = isAuthError
      ? "bg-[rgba(245,158,11,0.15)]"
      : errorStatus === 400
        ? "bg-[rgba(239,68,68,0.15)]"
        : "bg-[rgba(239,68,68,0.15)]";

    const iconColor = isAuthError
      ? "text-[var(--y-warn)]"
      : "text-[var(--y-danger)]";

    return (
      <div className="fixed inset-0 z-[2000] grid place-items-center bg-black/80 p-4 backdrop-blur">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-6 text-center"
        >
          {/* Icon */}
          <div
            className={cn(
              "mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl",
              iconBg,
            )}
          >
            {isAuthError ? (
              <RefreshCw size={28} className={iconColor} />
            ) : errorStatus === 400 ? (
              <FileWarning size={28} className={iconColor} />
            ) : (
              <AlertCircle size={28} className={iconColor} />
            )}
          </div>

          {/* Title */}
          <h3 className="mb-2 text-base font-semibold text-[var(--y-text)]">
            {errorTitle}
          </h3>

          {/* Message */}
          <p className="mb-5 text-sm leading-relaxed text-[var(--y-text-dim)]">
            {errorMessage}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {/* Tombol Reconnect — hanya kalau auth error */}
            {isAuthError && (
              <button
                onClick={() => {
                  onClose();
                  setView("drives");
                }}
                className="y-gradient-brand y-glow-primary inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              >
                <RefreshCw size={15} />
                Buka Menu Google Drive
              </button>
            )}

            {/* Tombol Coba Lagi — untuk semua error */}
            <button
              onClick={() => reload()}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] text-sm font-semibold text-[var(--y-text)] transition-colors hover:bg-[var(--y-bg-hover)]"
            >
              <RefreshCw size={15} />
              Coba Lagi
            </button>

            {/* Tombol Tutup */}
            <button
              onClick={onClose}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-[var(--y-text-dim)] transition-colors hover:bg-[var(--y-bg-hover)]"
            >
              Tutup
            </button>
          </div>

          {/* Info detail (opsional, untuk debugging) */}
          {errorStatus > 0 && (
            <div className="mt-4 text-[10px] text-[var(--y-text-mute)]">
              Error code: {errorStatus}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // =====================================================
  // RENDER: MAIN EDITOR
  // =====================================================
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[2000] flex flex-col bg-[var(--y-bg)]"
    >
      {/* ===== HEADER ===== */}
      <div className="y-glass flex h-14 items-center gap-3 border-b border-[var(--y-border)] px-4">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--y-text)]">
            {displayName}
          </div>
          <SaveStatus state={saveState} />
        </div>
        <button
          onClick={openHistory}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--y-border)] px-3 text-xs font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
        >
          <History size={14} />
          <span className="hidden sm:inline">Riwayat</span>
        </button>
        <button
          onClick={() => {
            if (editor) saveNow(editor.getHTML());
          }}
          disabled={saveState.status === "saving"}
          className="y-gradient-brand inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          {saveState.status === "saving" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          <span className="hidden sm:inline">Simpan</span>
        </button>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-lg text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
        >
          <X size={18} />
        </button>
      </div>

      {/* ===== TOOLBAR ===== */}
      <div className="y-glass sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-[var(--y-border)] px-3 py-1.5">
        <ToolbarBtn
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive("strike")}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive("highlight")}
          onClick={() => editor?.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          <Highlighter size={15} />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          active={editor?.isActive("heading", { level: 1 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="Heading 1"
        >
          <Heading1 size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading 2"
        >
          <Heading2 size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Heading 3"
        >
          <Heading3 size={15} />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrdered size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <Quote size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive("codeBlock")}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <Code size={15} />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          active={editor?.isActive({ textAlign: "left" })}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          title="Align Left"
        >
          <AlignLeft size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive({ textAlign: "center" })}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          title="Align Center"
        >
          <AlignCenter size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive({ textAlign: "right" })}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          title="Align Right"
        >
          <AlignRight size={15} />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          title="Insert Table"
        >
          <TableIcon size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => fileInputRef.current?.click()}
          title="Insert Image"
        >
          <ImageIcon size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            const url = window.prompt("URL:");
            if (url) editor?.chain().focus().setLink({ href: url }).run();
          }}
          active={editor?.isActive("link")}
          title="Link"
        >
          <LinkIcon size={15} />
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo size={15} />
        </ToolbarBtn>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageUpload}
        />
      </div>

      {/* ===== CONTENT ===== */}
      <div className="flex-1 overflow-auto bg-[#1a1f2e] py-6">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* ===== HISTORY DRAWER ===== */}
      {historyOpen && (
        <div className="fixed inset-0 z-[2100] flex">
          <div
            className="flex-1 bg-black/50"
            onClick={() => setHistoryOpen(false)}
          />
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="w-[360px] overflow-y-auto bg-[var(--y-bg-elev)] p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--y-text)]">
                Riwayat Versi
              </h3>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-[var(--y-text-mute)] hover:text-[var(--y-text)]"
              >
                <X size={16} />
              </button>
            </div>
            {versions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--y-text-mute)]">
                Belum ada versi tersimpan
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--y-text)]">
                        Versi {v.version_number}
                      </span>
                      <button
                        onClick={() => handleRestore(v.version_number)}
                        className="text-xs text-[var(--y-primary)] hover:underline"
                      >
                        Pulihkan
                      </button>
                    </div>
                    <div className="mt-1 text-[10px] text-[var(--y-text-mute)]">
                      {new Date(v.created_at).toLocaleString("id-ID")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// =====================================================
// SUB-COMPONENTS
// =====================================================
function ToolbarBtn({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "grid h-8 w-8 place-items-center rounded transition-colors",
        active
          ? "bg-[var(--y-primary)] text-white"
          : "text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
        disabled && "cursor-not-allowed opacity-30",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-[var(--y-border)]" />;
}

 function SaveStatus({
  state,
}: {
  state: {
    status: "idle" | "saving" | "saved" | "error" | "unsaved";
    lastSavedAt: Date | null;
    error: string | null;
  };
}){
  if (state.status === "saving") {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--y-text-mute)]">
        <Loader2 size={11} className="animate-spin" />
        Menyimpan…
      </div>
    );
  }
  if (state.status === "saved" && state.lastSavedAt) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--y-success)]">
        <CheckCircle2 size={11} />
        Tersimpan{" "}
        {new Date(state.lastSavedAt).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--y-danger)]">
        <AlertCircle size={11} />
        {state.error || "Gagal simpan"}
      </div>
    );
  }
  if (state.status === "unsaved") {
    return (
      <div className="text-[11px] text-[var(--y-warn)]">● Belum tersimpan</div>
    );
  }
  return null;
}