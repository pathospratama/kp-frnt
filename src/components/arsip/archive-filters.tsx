// Bilah pencarian + filter arsip. Pencarian & filter dikirim ke backend
// lewat store (fetchFiles), bukan filter client-side.
"use client";

import { Search, RotateCcw, X } from "lucide-react";
import { useYudit, availableYears } from "@/lib/yudit/store";
import { MONTHS_ID } from "@/lib/yudit/utils";

const inputCls =
  "y-focus h-10 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-sm text-[var(--y-text)] outline-none";
const labelCls = "mb-1 block text-xs font-medium text-[var(--y-text-dim)]";

export function ArchiveFilters({ resultCount }: { resultCount: number }) {
  const searchQuery = useYudit((s) => s.searchQuery);
  const setSearch = useYudit((s) => s.setSearch);
  const currentCategory = useYudit((s) => s.currentCategory);
  const setCategory = useYudit((s) => s.setCategory);
  const filters = useYudit((s) => s.filters);
  const setFilters = useYudit((s) => s.setFilters);
  const resetFilters = useYudit((s) => s.resetFilters);
  const files = useYudit((s) => s.files);
  const defaultCategories = useYudit((s) => s.defaultCategories);
  const customCategories = useYudit((s) => s.customCategories);

  const years = availableYears(files);
  const allCategories = [
    ...defaultCategories.map((c) => c.name),
    ...customCategories.map((c) => c.name),
  ];

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (currentCategory !== "all")
    activeChips.push({ key: "cat", label: `Kategori: ${currentCategory}`, clear: () => setCategory("all") });
  if (filters.year)
    activeChips.push({ key: "year", label: `Tahun: ${filters.year}`, clear: () => setFilters({ ...filters, year: undefined }) });
  if (filters.month)
    activeChips.push({
      key: "month",
      label: `Bulan: ${MONTHS_ID[filters.month - 1]}`,
      clear: () => setFilters({ ...filters, month: undefined }),
    });
  if (searchQuery)
    activeChips.push({ key: "q", label: `“${searchQuery}”`, clear: () => setSearch("") });

  return (
    <div className="mb-4 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-4">
      <label htmlFor="arsip-search" className="sr-only">
        Cari arsip
      </label>
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)]" />
        <input
          id="arsip-search"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama dokumen, nomor surat, atau kata kunci…"
          className={`${inputCls} h-11 w-full pl-10`}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="filter-kategori" className={labelCls}>Kategori</label>
          <select
            id="filter-kategori"
            value={currentCategory}
            onChange={(e) => setCategory(e.target.value)}
            className={`${inputCls} w-full`}
          >
            <option value="all">Semua kategori</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-tahun" className={labelCls}>Tahun</label>
          <select
            id="filter-tahun"
            value={filters.year ?? ""}
            onChange={(e) =>
              setFilters({ ...filters, year: e.target.value ? Number(e.target.value) : undefined })
            }
            className={`${inputCls} w-full`}
          >
            <option value="">Semua tahun</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-bulan" className={labelCls}>Bulan</label>
          <select
            id="filter-bulan"
            value={filters.month ?? ""}
            onChange={(e) =>
              setFilters({ ...filters, month: e.target.value ? Number(e.target.value) : undefined })
            }
            className={`${inputCls} w-full`}
          >
            <option value="">Semua bulan</option>
            {MONTHS_ID.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={resetFilters}
            disabled={activeChips.length === 0}
            className="y-focus inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--y-border)] px-3 text-sm font-medium text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={15} />
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="tnum text-[13px] text-[var(--y-text-dim)]">
          {resultCount} arsip ditemukan
        </span>
        {activeChips.map((chip) => (
          <button
            key={chip.key}
            onClick={chip.clear}
            className="y-focus inline-flex items-center gap-1 rounded-full bg-[#e4e9f0] px-2.5 py-1 text-xs font-medium text-[var(--y-primary)] hover:bg-[#d8dfea]"
            aria-label={`Hapus filter ${chip.label}`}
          >
            {chip.label}
            <X size={13} />
          </button>
        ))}
      </div>
    </div>
  );
}
