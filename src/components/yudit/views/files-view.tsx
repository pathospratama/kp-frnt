"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Tags, RefreshCw, X, Inbox } from "lucide-react";
import { useYudit, categoryCounts, availableYears } from "@/lib/yudit/store";
import { CATEGORY_META, getCategoryMeta, FILE_TYPES, MONTHS_ID } from "@/lib/yudit/utils";
import type { FileItem, Filters } from "@/lib/yudit/types";
import { FileRow } from "../ui/file-row";
import { Dropzone } from "../ui/dropzone";
import { cn } from "@/lib/utils";

export function FilesView() {
  const files = useYudit((s) => s.files);
  const customCategories = useYudit((s) => s.customCategories);
  const currentCategory = useYudit((s) => s.currentCategory);
  const setCategory = useYudit((s) => s.setCategory);
  const searchQuery = useYudit((s) => s.searchQuery);
  const setSearch = useYudit((s) => s.setSearch);
  const filters = useYudit((s) => s.filters);
  const setFilters = useYudit((s) => s.setFilters);
  const resetFilters = useYudit((s) => s.resetFilters);
  const filterPanelOpen = useYudit((s) => s.filterPanelOpen);
  const setFilterPanelOpen = useYudit((s) => s.setFilterPanelOpen);
  const setCategoryManagerOpen = useYudit((s) => s.setCategoryManagerOpen);

  const counts = useMemo(() => categoryCounts(files), [files]);
  const years = useMemo(() => availableYears(files), [files]);
  const totalCount = files.length;

  // Filtered files
  const filtered = useMemo(() => {
    let list = [...files];
    if (currentCategory !== "all") {
      list = list.filter((f) => f.category === currentCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    const f = filters;
    if (f.year) list = list.filter((x) => x.year === f.year);
    if (f.month) list = list.filter((x) => x.month === f.month);
    if (f.date_from)
      list = list.filter((x) => new Date(x.created_at) >= new Date(f.date_from!));
    if (f.date_to)
      list = list.filter((x) => new Date(x.created_at) <= new Date(f.date_to! + "T23:59:59"));
    if (f.file_type) {
      list = list.filter((x) => {
        const ext = (x.name.split(".").pop() || "").toLowerCase();
        return ext === f.file_type;
      });
    }
    // sort
    const sortBy = f.sort_by || "created_at";
    const sortOrder = f.sort_order || "desc";
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "size") cmp = a.size - b.size;
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return list;
  }, [files, currentCategory, searchQuery, filters]);

  return (
    <div className="y-anim-fade">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--y-text)]">My Files</h1>
          <p className="text-[13px] text-[var(--y-text-dim)]">
            {filtered.length} file{filtered.length !== 1 && "s"}
            {currentCategory !== "all" && ` • ${currentCategory}`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)]"
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama file…"
          className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] pl-10 pr-10 text-sm text-[var(--y-text)] placeholder:text-[var(--y-text-mute)] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] hover:text-[var(--y-text)]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ToolbarBtn
          active={filterPanelOpen}
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
        >
          <SlidersHorizontal size={14} />
          Filter Lanjutan
          {Object.keys(filters).length > 0 && (
            <span className="ml-1 rounded-full bg-[var(--y-primary)] px-1.5 text-[10px] text-white">
              {Object.keys(filters).filter((k) => k !== "sort_by" && k !== "sort_order").length}
            </span>
          )}
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setCategoryManagerOpen(true)}>
          <Tags size={14} />
          Kelola Kategori
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            setFilters({});
            setSearch("");
            setCategory("all");
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </ToolbarBtn>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {filterPanelOpen && (
          <FilterPanel
            years={years}
            current={filters}
            onApply={(f) => {
              setFilters(f);
              setFilterPanelOpen(false);
            }}
            onReset={() => {
              resetFilters();
            }}
          />
        )}
      </AnimatePresence>

      {/* Active filter badges */}
      <ActiveFilters
        filters={filters}
        onRemove={(key) => {
          const next = { ...filters };
          delete (next as Record<string, unknown>)[key];
          setFilters(next);
        }}
        onReset={resetFilters}
      />

      {/* Category tabs */}
      <CategoryTabs
        counts={counts}
        current={currentCategory}
        onSelect={setCategory}
        customCats={customCategories.map((c) => ({ name: c.name, icon: c.icon }))}
      />

      {/* Dropzone */}
      <Dropzone />

      {/* File list */}
      <FileList files={filtered} emptyCategory={currentCategory} />
    </div>
  );
}

function ToolbarBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-all",
        active
          ? "border-[var(--y-primary)] bg-[var(--y-primary)] text-white"
          : "border-[var(--y-border)] bg-[var(--y-bg-elev)] text-[var(--y-text-dim)] hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
      )}
    >
      {children}
    </button>
  );
}

function FilterPanel({
  years,
  current,
  onApply,
  onReset,
}: {
  years: string[];
  current: Filters;
  onApply: (f: Filters) => void;
  onReset: () => void;
}) {
  const [year, setYear] = useState(current.year ? String(current.year) : "");
  const [month, setMonth] = useState(current.month ? String(current.month) : "");
  const [dateFrom, setDateFrom] = useState(current.date_from || "");
  const [dateTo, setDateTo] = useState(current.date_to || "");
  const [fileType, setFileType] = useState(current.file_type || "");
  const [sort, setSort] = useState(
    current.sort_by && current.sort_order
      ? `${current.sort_by}:${current.sort_order}`
      : "created_at:desc",
  );

  const apply = () => {
    const f: Filters = {};
    if (year) f.year = parseInt(year);
    if (month) f.month = parseInt(month);
    if (dateFrom) f.date_from = dateFrom;
    if (dateTo) f.date_to = dateTo;
    if (fileType) f.file_type = fileType;
    if (sort) {
      const [by, order] = sort.split(":");
      f.sort_by = by as Filters["sort_by"];
      f.sort_order = order as Filters["sort_order"];
    }
    onApply(f);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-4 overflow-hidden rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)]"
    >
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <FilterGroup label="Tahun">
            <FilterSelect value={year} onChange={setYear}>
              <option value="">Semua Tahun</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>
          <FilterGroup label="Bulan">
            <FilterSelect value={month} onChange={setMonth}>
              <option value="">Semua Bulan</option>
              {MONTHS_ID.map((m, i) => (
                <option key={i} value={String(i + 1)}>
                  {m}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>
          <FilterGroup label="Tipe File">
            <FilterSelect value={fileType} onChange={setFileType}>
              <option value="">Semua Tipe</option>
              {FILE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>
          <FilterGroup label="Dari Tanggal">
            <FilterInput type="date" value={dateFrom} onChange={setDateFrom} />
          </FilterGroup>
          <FilterGroup label="Sampai Tanggal">
            <FilterInput type="date" value={dateTo} onChange={setDateTo} />
          </FilterGroup>
          <FilterGroup label="Urutkan">
            <FilterSelect value={sort} onChange={setSort}>
              <option value="created_at:desc">Terbaru</option>
              <option value="created_at:asc">Terlama</option>
              <option value="name:asc">Nama A-Z</option>
              <option value="name:desc">Nama Z-A</option>
              <option value="size:desc">Ukuran Terbesar</option>
              <option value="size:asc">Ukuran Terkecil</option>
            </FilterSelect>
          </FilterGroup>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-[var(--y-border-soft)] pt-3">
          <button
            onClick={onReset}
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold text-[var(--y-text-dim)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
          >
            Reset
          </button>
          <button
            onClick={apply}
            className="y-gradient-brand inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold text-white"
          >
            Terapkan
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="y-focus h-9 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[13px] text-[var(--y-text)] outline-none"
    >
      {children}
    </select>
  );
}

function FilterInput({
  type,
  value,
  onChange,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="y-focus h-9 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[13px] text-[var(--y-text)] outline-none [color-scheme:dark]"
    />
  );
}

function ActiveFilters({
  filters,
  onRemove,
  onReset,
}: {
  filters: Filters;
  onRemove: (key: string) => void;
  onReset: () => void;
}) {
  const items: { key: string; label: string }[] = [];
  if (filters.year) items.push({ key: "year", label: `Tahun: ${filters.year}` });
  if (filters.month)
    items.push({ key: "month", label: `Bulan: ${MONTHS_ID[filters.month - 1]}` });
  if (filters.date_from) items.push({ key: "date_from", label: `Dari: ${filters.date_from}` });
  if (filters.date_to) items.push({ key: "date_to", label: `Sampai: ${filters.date_to}` });
  if (filters.file_type)
    items.push({ key: "file_type", label: `Tipe: ${filters.file_type.toUpperCase()}` });

  if (items.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {items.map((it) => (
        <div
          key={it.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--y-primary)] px-2.5 py-1 text-[11px] font-semibold text-white"
        >
          {it.label}
          <button
            onClick={() => onRemove(it.key)}
            className="grid h-4 w-4 place-items-center rounded-full hover:bg-white/20"
          >
            <X size={11} />
          </button>
        </div>
      ))}
      <button
        onClick={onReset}
        className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-[var(--y-text-dim)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
      >
        Hapus Semua
      </button>
    </div>
  );
}

function CategoryTabs({
  counts,
  current,
  onSelect,
  customCats,
}: {
  counts: Record<string, number>;
  current: string;
  onSelect: (cat: string) => void;
  customCats: { name: string; icon: string }[];
}) {
  const totalCount = Object.values(counts).reduce((s, n) => s + n, 0);

  const tabs: { name: string; icon: string; count: number }[] = [];
  // custom first
  customCats.forEach((c) => {
    const cnt = counts[c.name] || 0;
    if (cnt > 0) tabs.push({ name: c.name, icon: c.icon, count: cnt });
  });
  // built-in priority order
  const PRIORITY = Object.keys(CATEGORY_META);
  PRIORITY.forEach((name) => {
    const cnt = counts[name] || 0;
    if (cnt > 0) {
      const meta = getCategoryMeta(name, customCats);
      tabs.push({ name, icon: meta.icon, count: cnt });
    }
  });

  return (
    <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1.5 [scrollbar-width:thin]">
      <CatTab
        active={current === "all"}
        icon="📂"
        label="Semua"
        count={totalCount}
        onClick={() => onSelect("all")}
      />
      {tabs.map((t) => (
        <CatTab
          key={t.name}
          active={current === t.name}
          icon={t.icon}
          label={t.name}
          count={t.count}
          onClick={() => onSelect(t.name)}
        />
      ))}
    </div>
  );
}

function CatTab({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
        active
          ? "border-transparent bg-gradient-to-br from-[var(--y-primary)] to-[#8b5cf6] text-white y-glow-primary"
          : "border-[var(--y-border)] bg-[var(--y-bg-elev)] text-[var(--y-text-dim)] hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
      )}
    >
      <span>{icon}</span>
      <span className="max-w-[140px] truncate">{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
          active ? "bg-white/25" : "bg-white/10",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function FileList({
  files,
  emptyCategory,
}: {
  files: FileItem[];
  emptyCategory: string;
}) {
  if (files.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--y-border)] py-16 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--y-bg-elev)]">
          <Inbox size={28} className="text-[var(--y-text-mute)]" />
        </div>
        <div className="mt-3 text-sm font-semibold text-[var(--y-text-dim)]">
          {emptyCategory !== "all"
            ? `Belum ada file kategori "${emptyCategory}"`
            : "Belum ada file"}
        </div>
        <div className="mt-1 text-xs text-[var(--y-text-mute)]">
          Upload file untuk memulai
        </div>
      </div>
    );
  }

  // Header row
  return (
    <div className="rounded-2xl border border-[var(--y-border-soft)] bg-[rgba(17,24,53,0.4)] p-2">
      <div
        className="hidden items-center gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)] sm:grid"
        style={{ gridTemplateColumns: "44px 1fr 90px 150px 120px" }}
      >
        <div className="text-center">Tipe</div>
        <div>Nama</div>
        <div>Ukuran</div>
        <div>Kategori</div>
        <div className="text-right">Aksi</div>
      </div>
      <div className="flex flex-col gap-0.5">
        {files.map((f, i) => (
          <FileRow key={f.id} file={f} index={i} showFolder={false} />
        ))}
      </div>
    </div>
  );
}
