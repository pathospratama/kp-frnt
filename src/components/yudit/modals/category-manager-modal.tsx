// src/components/yudit/modals/category-manager-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Trash2, Tags, Sparkles, Loader2 } from "lucide-react";

import { useYudit } from "@/lib/yudit/store";
import { cn } from "@/lib/utils";

export function CategoryManagerModal() {
  const open = useYudit((s) => s.categoryManagerOpen);
  const setOpen = useYudit((s) => s.setCategoryManagerOpen);
  const defaultCats = useYudit((s) => s.defaultCategories);
  const customCats = useYudit((s) => s.customCategories);
  const addCustomCategory = useYudit((s) => s.addCustomCategory);
  const removeCustomCategory = useYudit((s) => s.removeCustomCategory);
  const showConfirm = useYudit((s) => s.showConfirm);

  const [icon, setIcon] = useState("📄");
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const kw = keywords
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await addCustomCategory(name.trim(), icon.trim() || "📄", kw);
      setName("");
      setKeywords("");
      setIcon("📄");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (id: string, name: string) => {
    showConfirm(
      `Hapus "${name}"?`,
      'File dengan kategori ini akan dipindah ke "Lainnya".',
      async () => {
        await removeCustomCategory(id);
      },
    );
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
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="y-glass-strong y-glow-soft flex max-h-[88vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-[var(--y-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--y-border)] p-5">
              <div className="y-gradient-brand y-glow-primary grid h-10 w-10 shrink-0 place-items-center rounded-xl">
                <Tags size={18} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-[var(--y-text)]">Kelola Kategori</h3>
                <p className="text-xs text-[var(--y-text-dim)]">
                  Kategori bawaan sistem tidak bisa dihapus.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-[var(--y-text-mute)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[280px] overflow-y-auto p-4">
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
                Kategori Bawaan
              </div>
              <div className="mb-4 flex flex-col gap-1.5">
                {defaultCats.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--y-border)] py-3 text-center text-xs text-[var(--y-text-mute)]">
                    Belum dimuat
                  </div>
                ) : (
                  defaultCats.map((c) => (
                    <div
                      key={c.id || c.name}
                      className="flex items-center gap-3 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 py-2"
                    >
                      <span className="text-lg">{c.icon}</span>
                      <span className="flex-1 text-[13px] font-semibold text-[var(--y-text)]">
                        {c.name}
                      </span>
                      <span className="rounded-full bg-[var(--y-bg-hover)] px-2 py-0.5 text-[10px] font-semibold text-[var(--y-text-mute)]">
                        Bawaan
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
                Kategori Custom
              </div>
              {customCats.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--y-border)] py-6 text-center text-xs text-[var(--y-text-mute)]">
                  Belum ada kategori custom. Tambahkan di bawah.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {customCats.map((c) => (
                    <div
                      key={c.id}
                      className="group flex items-center gap-3 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 py-2"
                    >
                      <span className="text-lg">{c.icon}</span>
                      <span className="flex-1 text-[13px] font-semibold text-[var(--y-text)]">
                        {c.name}
                      </span>
                      {c.keywords.length > 0 && (
                        <span className="hidden text-[11px] text-[var(--y-text-mute)] sm:inline">
                          {c.keywords.join(", ")}
                        </span>
                      )}
                      <button
                        onClick={() => handleRemove(c.id, c.name)}
                        className="grid h-7 w-7 place-items-center rounded-md text-[var(--y-text-mute)] transition-colors hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-danger)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[var(--y-border)] bg-[rgba(11,16,32,0.4)] p-4">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--y-text)]">
                <Sparkles size={14} className="text-[var(--y-primary)]" />
                Tambah Kategori Baru
              </div>
              <div className="grid grid-cols-[60px_1fr] gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--y-text-mute)]">Icon</label>
                  <input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    maxLength={2}
                    className="y-focus h-9 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] text-center text-lg outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--y-text-mute)]">Nama</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Laporan Bulanan"
                    className="y-focus h-9 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[13px] text-[var(--y-text)] placeholder:text-[var(--y-text-mute)] outline-none"
                  />
                </div>
              </div>
              <div className="mt-2.5 flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[var(--y-text-mute)]">
                  Keywords (pisahkan koma)
                </label>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="laporan, bulanan, report"
                  className="y-focus h-9 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[13px] text-[var(--y-text)] placeholder:text-[var(--y-text-mute)] outline-none"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!name.trim() || saving}
                className={cn(
                  "y-gradient-brand mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-white transition-all",
                  "hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0",
                )}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Tambah Kategori
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}