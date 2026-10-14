"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronRight, ChevronsUpDown, Search, X } from "lucide-react";
import { useYudit, groupByFolder } from "@/lib/yudit/store";
import { MONTHS_ID, formatBytes } from "@/lib/yudit/utils";
import type { FileItem } from "@/lib/yudit/types";
import { FileRow } from "../ui/file-row";

export function MonthlyView() {
  const files = useYudit((s) => s.files);
  const search = useYudit((s) => s.monthlySearchQuery);
  const setSearch = useYudit((s) => s.setMonthlySearch);
  const expanded = useYudit((s) => s.expandedMonthly);
  const toggle = useYudit((s) => s.toggleMonthly);
  const collapseAll = useYudit((s) => s.collapseAllMonthly);
  const expandAll = useYudit((s) => s.expandAllMonthly);

  const grouped = useMemo(() => groupByFolder(files), [files]);

  const sortedKeys = useMemo(() => {
    const parseKey = (s: string) => {
      if (s.includes("Tanpa Folder")) return 0;
      const cleaned = s.replace("📅 ", "");
      const parts = cleaned.split(" ");
      const m = parts[0];
      const y = parseInt(parts[1] || "0");
      const mi = MONTHS_ID.indexOf(m);
      return y * 100 + (mi >= 0 ? mi + 1 : 0);
    };
    return Object.keys(grouped).sort((a, b) => parseKey(b) - parseKey(a));
  }, [grouped]);

  const filteredKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedKeys;
    return sortedKeys.filter((k) => {
      if (k.toLowerCase().includes(q)) return true;
      return grouped[k].some((f) => f.name.toLowerCase().includes(q));
    });
  }, [sortedKeys, grouped, search]);

  const totalFiles = filteredKeys.reduce(
    (s, k) => s + grouped[k].filter((f) => matchSearch(f.name, k, search)).length,
    0,
  );

  const anyExpanded = Object.values(expanded).some(Boolean);

  return (
    <div className="y-anim-fade">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--y-text)]">Arsip Per Bulan</h1>
          <p className="text-[13px] text-[var(--y-text-dim)]">
            {filteredKeys.length} folder • {totalFiles} file
          </p>
        </div>
        <button
          onClick={() => (anyExpanded ? collapseAll() : expandAll())}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] font-semibold text-[var(--y-text-dim)] transition-all hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
        >
          <ChevronsUpDown size={15} />
          {anyExpanded ? "Lipat Semua" : "Buka Semua"}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)]"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari di semua folder bulanan…"
          className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] pl-10 pr-10 text-sm text-[var(--y-text)] placeholder:text-[var(--y-text-mute)] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] hover:text-[var(--y-text)]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Groups */}
      {filteredKeys.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredKeys.map((key, idx) => {
            const allFiles = grouped[key];
            const files = search
              ? allFiles.filter(
                  (f) =>
                    f.name.toLowerCase().includes(search.toLowerCase()) ||
                    key.toLowerCase().includes(search.toLowerCase()),
                )
              : allFiles;
            if (files.length === 0) return null;
            const totalSize = files.reduce((s, f) => s + f.size, 0);
            const isOpen = expanded[key] ?? (idx === 0 && !search);
            return (
              <MonthlyGroup
                key={key}
                name={key}
                count={files.length}
                totalSize={totalSize}
                isOpen={!!isOpen}
                onToggle={() => toggle(key)}
                files={files}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function matchSearch(name: string, folder: string, q: string) {
  if (!q) return true;
  const ql = q.toLowerCase();
  return name.toLowerCase().includes(ql) || folder.toLowerCase().includes(ql);
}

function MonthlyGroup({
  name,
  count,
  totalSize,
  isOpen,
  onToggle,
  files,
}: {
  name: string;
  count: number;
  totalSize: number;
  isOpen: boolean;
  onToggle: () => void;
  files: FileItem[];
}) {
  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] transition-colors hover:border-[rgba(99,102,241,0.3)]"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 border-b border-[var(--y-border-soft)] px-4 py-3.5 text-left transition-colors hover:bg-[rgba(99,102,241,0.06)]"
        style={{
          background: isOpen
            ? "linear-gradient(90deg, rgba(99,102,241,0.1), transparent)"
            : undefined,
        }}
      >
        <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={16} className="text-[var(--y-text-mute)]" />
        </motion.span>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[rgba(99,102,241,0.15)]">
          <CalendarDays size={17} className="text-[var(--y-primary)]" />
        </div>
        <span className="flex-1 text-[15px] font-bold text-[var(--y-text)]">{name}</span>
        <span className="rounded-full border border-[var(--y-border)] bg-[var(--y-bg)] px-3 py-1 text-xs font-semibold text-[var(--y-text-dim)] tabular-nums">
          {count} file • {formatBytes(totalSize)}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 p-2">
              {files.map((f, i) => (
                <FileRow key={f.id} file={f} index={i} showFolder={false} alwaysShowActions />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--y-border)] py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--y-bg-elev)]">
        <CalendarDays size={28} className="text-[var(--y-text-mute)]" />
      </div>
      <div className="mt-3 text-sm font-semibold text-[var(--y-text-dim)]">
        {search ? "Tidak ada hasil" : "Belum ada arsip bulanan"}
      </div>
      <div className="mt-1 text-xs text-[var(--y-text-mute)]">
        {search
          ? `Pencarian "${search}" tidak ditemukan`
          : "Upload file untuk mulai mengorganisir per bulan"}
      </div>
    </div>
  );
}
