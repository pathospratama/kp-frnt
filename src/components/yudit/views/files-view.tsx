// src/components/yudit/views/files-view.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Tags,
  RefreshCw,
  X,
  Inbox,
  Folder,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  useYudit,
  categoryCounts,
  availableYears,
  canManageWorkspace,
} from "@/lib/yudit/store";
import {
  CATEGORY_META,
  getCategoryMeta,
  FILE_TYPES,
  MONTHS_ID,
} from "@/lib/yudit/utils";
import type { FileItem, Filters } from "@/lib/yudit/types";
import { FileRow } from "../ui/file-row";
import { Dropzone } from "../ui/dropzone";
import { cn } from "@/lib/utils";

// ⭐ NEW — Folder types
import type { FolderItem, BreadcrumbItem } from "@/lib/api/folders";

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

  // ⭐ NEW — Folder state
  const currentFolderId = useYudit((s) => s.currentFolderId);
  const folderBreadcrumb = useYudit((s) => s.folderBreadcrumb);
  const fetchFolders = useYudit((s) => s.fetchFolders);
  const filesLoading = useYudit((s) => s.filesLoading);

  // ⭐ Auto-fetch folder list saat masuk FilesView pertama kali
  useEffect(() => {
    fetchFolders(currentFolderId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  const counts = useMemo(() => categoryCounts(files), [files]);
  const years = useMemo(() => availableYears(files), [files]);

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
      list = list.filter(
        (x) => new Date(x.created_at) >= new Date(f.date_from!),
      );
    if (f.date_to)
      list = list.filter(
        (x) => new Date(x.created_at) <= new Date(f.date_to! + "T23:59:59"),
      );
    if (f.file_type) {
      list = list.filter((x) => {
        const ext = (x.name.split(".").pop() || "").toLowerCase();
        return ext === f.file_type;
      });
    }
    const sortBy = f.sort_by || "created_at";
    const sortOrder = f.sort_order || "desc";
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "size") cmp = a.size - b.size;
      else
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return list;
  }, [files, currentCategory, searchQuery, filters]);

  return (
    <div className="y-anim-fade">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--y-text)]">
            {currentFolderId ? "Folder Contents" : "My Files"}
          </h1>
          <p className="text-[13px] text-[var(--y-text-dim)]">
            {filtered.length} file{filtered.length !== 1 && "s"}
            {currentCategory !== "all" && ` • ${currentCategory}`}
          </p>
        </div>
      </div>

      {/* ⭐ NEW — Breadcrumb (hanya tampil kalau di dalam folder) */}
      <FolderBreadcrumb />

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
            <span className="ml-1 rounded-full bg-white px-1.5 text-[10px] text-[var(--y-primary)]">
              {
                Object.keys(filters).filter(
                  (k) => k !== "sort_by" && k !== "sort_order",
                ).length
              }
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

      <ActiveFilters
        filters={filters}
        onRemove={(key) => {
          const next = { ...filters };
          delete (next as Record<string, unknown>)[key];
          setFilters(next);
        }}
        onReset={resetFilters}
      />

      {/* ⭐ NEW — Folder grid (hanya tampil kalau tidak dalam folder kosong) */}
      <FolderGrid />

      <CategoryTabs
        counts={counts}
        current={currentCategory}
        onSelect={setCategory}
        customCats={customCategories.map((c) => ({
          name: c.name,
          icon: c.icon,
        }))}
      />

      <Dropzone />

      <FileList
        files={filtered}
        emptyCategory={currentCategory}
        loading={filesLoading && files.length === 0}
        currentFolderId={currentFolderId}
      />
    </div>
  );
}

/* ============================================================
   ⭐ FOLDER BREADCRUMB
   ============================================================ */
function FolderBreadcrumb() {
  const currentFolderId = useYudit((s) => s.currentFolderId);
  const breadcrumb = useYudit((s) => s.folderBreadcrumb);
  const setCurrentFolderId = useYudit((s) => s.setCurrentFolderId);

  if (!currentFolderId) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-1 overflow-x-auto rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 py-2"
    >
      <button
        onClick={() => setCurrentFolderId(null)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-semibold text-[var(--y-primary)] transition-colors hover:bg-[var(--y-bg-hover)]"
      >
        <Folder size={13} />
        My Files
      </button>
      {breadcrumb.map((item, idx) => {
        const isLast = idx === breadcrumb.length - 1;
        return (
          <span
            key={item.id}
            className="inline-flex shrink-0 items-center gap-1"
          >
            <ChevronRight
              size={13}
              className="text-[var(--y-text-mute)]"
            />
            <button
              onClick={() => !isLast && setCurrentFolderId(item.id)}
              disabled={isLast}
              className={cn(
                "max-w-[200px] truncate rounded-md px-2 py-1 text-[12.5px] font-semibold transition-colors",
                isLast
                  ? "cursor-default text-[var(--y-text)]"
                  : "text-[var(--y-primary)] hover:bg-[var(--y-bg-hover)]",
              )}
              title={item.name}
            >
              {item.name}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

/* ============================================================
   ⭐ FOLDER GRID
   ============================================================ */
function FolderGrid() {
  const folders = useYudit((s) => s.folders);
  const foldersLoading = useYudit((s) => s.foldersLoading);
  const setCurrentFolderId = useYudit((s) => s.setCurrentFolderId);
  const showConfirm = useYudit((s) => s.showConfirm);
  const deleteFolderAction = useYudit((s) => s.deleteFolderAction);
  const user = useYudit((s) => s.user);

  const isManager = canManageWorkspace(user);

  if (foldersLoading && folders.length === 0) {
    return (
      <div className="mb-4 flex items-center gap-2 text-[12px] text-[var(--y-text-mute)]">
        <Loader2 size={13} className="animate-spin" />
        Memuat folder…
      </div>
    );
  }

  if (folders.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--y-text-mute)]">
          Folder ({folders.length})
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {folders.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-center gap-2 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-2.5 transition-all hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)]"
          >
            <button
              onClick={() => setCurrentFolderId(f.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
              title={f.name}
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgba(245,158,11,0.15)]">
                <Folder size={15} className="text-[var(--y-warn)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-[var(--y-text)]">
                  {f.name}
                </div>
                <div className="text-[10px] text-[var(--y-text-mute)]">
                  {f.file_count} file
                </div>
              </div>
            </button>
            {isManager && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showConfirm(
                    `Hapus folder "${f.name}"?`,
                    f.file_count > 0
                      ? `Folder masih berisi ${f.file_count} file. Kosongkan folder terlebih dahulu.`
                      : "Folder akan dihapus permanen.",
                    async () => {
                      await deleteFolderAction(f.id);
                    },
                  );
                }}
                className="grid h-6 w-6 shrink-0 place-items-center rounded text-[var(--y-text-mute)] opacity-0 transition-opacity hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-danger)] group-hover:opacity-100"
                title="Hapus folder"
              >
                <Trash2 size={12} />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   TOOLBAR BTN
   ============================================================ */
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
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-sm transition-all",
        active
          ? "border-[var(--y-primary)] bg-[var(--y-primary)] text-white"
          : "border-[var(--y-border)] bg-[var(--y-bg-elev)] text-[var(--y-text-dim)] hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
      )}
    >
      {children}
    </button>
  );
}

/* ============================================================
   FILTER PANEL
   ============================================================ */
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
  const [year, setYear] = useState(
    current.year ? String(current.year) : "",
  );
  const [month, setMonth] = useState(
    current.month ? String(current.month) : "",
  );
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
      className="mb-4 overflow-hidden rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] shadow-sm"
    >
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="truncate text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
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
      className="y-focus h-9 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] text-[var(--y-text)] outline-none"
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
      className="y-focus h-9 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] text-[var(--y-text)] outline-none"
    />
  );
}

/* ============================================================
   ACTIVE FILTERS
   ============================================================ */
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
  if (filters.year)
    items.push({ key: "year", label: `Tahun: ${filters.year}` });
  if (filters.month)
    items.push({
      key: "month",
      label: `Bulan: ${MONTHS_ID[filters.month - 1]}`,
    });
  if (filters.date_from)
    items.push({ key: "date_from", label: `Dari: ${filters.date_from}` });
  if (filters.date_to)
    items.push({ key: "date_to", label: `Sampai: ${filters.date_to}` });
  if (filters.file_type)
    items.push({
      key: "file_type",
      label: `Tipe: ${filters.file_type.toUpperCase()}`,
    });

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
            className="grid h-4 w-4 place-items-center rounded-full hover:bg-black/20"
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

/* ============================================================
   CATEGORY TABS
   ============================================================ */
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
  customCats.forEach((c) => {
    const cnt = counts[c.name] || 0;
    if (cnt > 0) tabs.push({ name: c.name, icon: c.icon, count: cnt });
  });

  const PRIORITY = Object.keys(CATEGORY_META);
  PRIORITY.forEach((name) => {
    const cnt = counts[name] || 0;
    if (cnt > 0) {
      const meta = getCategoryMeta(name, customCats);
      tabs.push({ name, icon: meta.icon, count: cnt });
    }
  });

  return (
    <div className="mb-4 w-full min-w-0 overflow-hidden">
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 [scrollbar-width:thin]">
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
          ? "y-glow-primary border-transparent bg-gradient-to-br from-[var(--y-primary)] to-[var(--y-accent)] text-white"
          : "border-[var(--y-border)] bg-[var(--y-bg-elev)] text-[var(--y-text-dim)] hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
      )}
    >
      <span>{icon}</span>
      <span className="max-w-[140px] truncate">{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
          active ? "bg-white/25" : "bg-[var(--y-bg-elev-2)]",
        )}
      >
        {count}
      </span>
    </button>
  );
}

/* ============================================================
   FILE LIST — ⭐ header & row GRID IDENTIK di setiap breakpoint
   ============================================================ */
const GRID_COLS_MOBILE = "44px minmax(0,1fr) auto";
const GRID_COLS_TABLET = "44px minmax(0,1fr) 80px 140px";
const GRID_COLS_DESKTOP = "44px minmax(0,1fr) 100px 160px 200px";

function FileList({
  files,
  emptyCategory,
  loading,
  currentFolderId,
}: {
  files: FileItem[];
  emptyCategory: string;
  loading: boolean;
  currentFolderId: string | null;
}) {
  // ⭐ Loading state
  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] py-16 shadow-sm">
        <Loader2
          size={28}
          className="animate-spin text-[var(--y-primary)]"
        />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--y-border)] bg-[var(--y-bg-elev)] py-16 text-center shadow-sm">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--y-bg-hover)]">
          <Inbox size={28} className="text-[var(--y-text-mute)]" />
        </div>
        <div className="mt-3 text-sm font-semibold text-[var(--y-text-dim)]">
          {emptyCategory !== "all"
            ? `Belum ada file kategori "${emptyCategory}"`
            : currentFolderId
              ? "Folder ini masih kosong"
              : "Belum ada file"}
        </div>
        <div className="mt-1 text-xs text-[var(--y-text-mute)]">
          {currentFolderId
            ? "Upload file untuk memulai"
            : "Upload file untuk memulai"}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-2 shadow-sm">
      {/* ⭐ Header — grid identik dengan FileRow */}
      <div
        className="hidden items-center gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)] sm:grid"
        style={{ gridTemplateColumns: GRID_COLS_TABLET }}
      >
        <div className="text-center">Tipe</div>
        <div>Nama</div>
        <div className="text-right">Ukuran</div>
        <div className="text-right">Aksi</div>
      </div>

      <div
        className="hidden items-center gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)] lg:grid"
        style={{ gridTemplateColumns: GRID_COLS_DESKTOP }}
      >
        <div className="text-center">Tipe</div>
        <div>Nama</div>
        <div className="text-right">Ukuran</div>
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

/* Ekspor konstanta grid agar FileRow memakai nilai yang sama persis */
export const FILE_GRID = {
  mobile: GRID_COLS_MOBILE,
  tablet: GRID_COLS_TABLET,
  desktop: GRID_COLS_DESKTOP,
};
