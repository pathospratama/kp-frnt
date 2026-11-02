// src/components/yudit/views/stats-view.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Files,
  HardDrive,
  CalendarRange,
  FileBox,
  RefreshCw,
  TrendingUp,
  Loader2,
} from "lucide-react";

import { useYudit } from "@/lib/yudit/store";
import { getStats, type StatsResponse } from "@/lib/api/files";
import { formatBytes, MONTHS_SHORT, getCategoryMeta } from "@/lib/yudit/utils";

export function StatsView() {
  const customCats = useYudit((s) => s.customCategories);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      try {
        const s = await getStats();
        setStats(s);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !stats) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 size={28} className="animate-spin text-[var(--y-primary)]" />
      </div>
    );
  }

  const cards = [
    {
      label: "Total File",
      value: String(stats.total_files),
      sub: "Semua file terupload",
      Icon: Files,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.12)",
    },
    {
      label: "Total Ukuran",
      value: formatBytes(stats.total_size),
      sub: "Kapasitas terpakai",
      Icon: HardDrive,
      color: "#22d3ee",
      bg: "rgba(34,211,238,0.12)",
    },
    {
      label: "Tahun Aktif",
      value: String(Object.keys(stats.by_year).length),
      sub: "Tahun dengan file",
      Icon: CalendarRange,
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
    },
    {
      label: "Tipe File",
      value: String(Object.keys(stats.by_type).length),
      sub: "Format berbeda",
      Icon: FileBox,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
    },
  ];

  return (
    <div className="y-anim-fade">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--y-text)]">
            Statistik &amp; Analytics
          </h1>
          <p className="text-[13px] text-[var(--y-text-dim)]">
            Overview penggunaan storage &amp; dokumen
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 text-[13px] font-semibold text-[var(--y-text-dim)] transition-all hover:border-[var(--y-primary)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.4)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
                {c.label}
              </span>
              <div
                className="grid h-8 w-8 place-items-center rounded-lg transition-transform group-hover:scale-110"
                style={{ background: c.bg }}
              >
                <c.Icon size={15} style={{ color: c.color }} />
              </div>
            </div>
            <div className="y-gradient-text mb-1 text-2xl font-bold tabular-nums">
              {c.value}
            </div>
            <div className="text-xs text-[var(--y-text-dim)]">{c.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Distribusi Per Bulan"
          icon="📅"
          entries={Object.entries(stats.by_month)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-8)}
          labelFn={(k) => {
            const [y, m] = k.split("-");
            return `${MONTHS_SHORT[parseInt(m) - 1]} ${y}`;
          }}
        />
        <ChartCard
          title="Distribusi Per Kategori"
          icon="🏷️"
          entries={Object.entries(stats.by_category).sort((a, b) => b[1] - a[1])}
          labelFn={(k) => k}
          colored
          customCats={customCats.map((c) => ({ name: c.name, icon: c.icon }))}
        />
      </div>

      <div className="mt-4">
        <ChartCard
          title="Distribusi Per Tipe File"
          icon="📄"
          entries={Object.entries(stats.by_type).sort((a, b) => b[1] - a[1])}
          labelFn={(k) => k.toUpperCase()}
          full
        />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  icon,
  entries,
  labelFn,
  colored,
  customCats,
  full,
}: {
  title: string;
  icon: string;
  entries: [string, number][];
  labelFn: (k: string) => string;
  colored?: boolean;
  customCats?: { name: string; icon: string }[];
  full?: boolean;
}) {
  const max = entries.length ? Math.max(...entries.map((e) => e[1])) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-bold text-[var(--y-text)]">{title}</h3>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--y-text-mute)]">
          <TrendingUp size={12} />
          {entries.length} item
        </span>
      </div>
      {entries.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--y-text-mute)]">
          Belum ada data
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.slice(0, 12).map(([key, count], i) => {
            const pct = max > 0 ? (count / max) * 100 : 0;
            const label = labelFn(key);
            const meta = colored ? getCategoryMeta(key, customCats || []) : null;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-32 shrink-0 truncate text-xs font-semibold text-[var(--y-text-dim)]"
                  title={label}
                >
                  {meta && <span className="mr-1">{meta.icon}</span>}
                  {label}
                </div>
                <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-[var(--y-bg)]">
                  <motion.div
                    className="flex h-full items-center justify-end rounded-md pr-2 text-[11px] font-bold text-white"
                    style={{
                      background: meta
                        ? `linear-gradient(90deg, ${meta.color}, ${meta.color}cc)`
                        : "linear-gradient(90deg, var(--y-primary), var(--y-accent))",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, 10)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                  >
                    {count}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}