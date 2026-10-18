// Dashboard admin: ringkasan yang membantu mengelola arsip.
// Metrik hanya dari data backend yang benar-benar tersedia.
"use client";

import { useEffect, useState } from "react";
import { Upload, ArrowRight } from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import { getStats, type StatsResponse } from "@/lib/api/files";
import { formatBytes } from "@/lib/yudit/utils";
import { FileIcon } from "@/components/yudit/ui/file-icon";
import { PageHeader } from "./page-header";
import { LoadingSkeleton } from "./state-views";

export function RingkasanView() {
  const files = useYudit((s) => s.files);
  const setView = useYudit((s) => s.setView);
  const openPreview = useYudit((s) => s.openPreview);
  const pool = useYudit((s) => s.pool);
  const drives = useYudit((s) => s.drives);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getStats();
        if (!cancelled) setStats(res);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recent = [...files]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5);

  const topCategories = stats
    ? Object.entries(stats.by_category).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];
  const maxCat = topCategories.length ? topCategories[0][1] : 1;
  const poolPct = pool.total > 0 ? Math.round((pool.used / pool.total) * 100) : 0;

  const metrics = [
    { label: "Total arsip", value: stats ? String(stats.total_files) : `${files.length}` },
    { label: "Total ukuran", value: stats ? formatBytes(stats.total_size) : "—" },
    { label: "Kategori terisi", value: stats ? String(Object.keys(stats.by_category).length) : "—" },
    { label: "Akun drive terhubung", value: String(drives.length) },
  ];

  return (
    <div>
      <PageHeader
        title="Ringkasan Arsip"
        description="Gambaran singkat pengelolaan arsip Bagian Persidangan."
        actions={
          <button
            onClick={() => setView("unggah")}
            className="y-focus inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--y-primary)] px-3.5 text-sm font-medium text-white hover:bg-[var(--y-primary-hover)]"
          >
            <Upload size={15} />
            Unggah Dokumen
          </button>
        }
      />

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          <dl className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-4 py-3.5">
                <dt className="text-[13px] text-[var(--y-text-dim)]">{m.label}</dt>
                <dd className="tnum mt-0.5 text-xl font-bold text-[var(--y-text)]">{m.value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-4 lg:grid-cols-5">
            <section className="rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-4 lg:col-span-3" aria-label="Dokumen terbaru">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--y-text)]">Dokumen terbaru</h2>
                <button
                  onClick={() => setView("arsip")}
                  className="y-focus inline-flex items-center gap-1 text-[13px] font-medium text-[var(--y-primary)] hover:underline"
                >
                  Lihat semua <ArrowRight size={14} />
                </button>
              </div>
              {recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--y-text-dim)]">Belum ada arsip.</p>
              ) : (
                <ul className="divide-y divide-[var(--y-border-soft)]">
                  {recent.map((f) => (
                    <li key={f.id}>
                      <button
                        onClick={() => openPreview(f.id)}
                        className="y-focus flex w-full items-center gap-3 py-2.5 text-left hover:bg-[var(--y-bg-hover)]/50"
                      >
                        <FileIcon mime={f.mime_type || ""} name={f.name} size={18} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--y-text)]">{f.name}</span>
                        <span className="tnum shrink-0 text-xs text-[var(--y-text-mute)]">{formatBytes(f.size)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-4 lg:col-span-2" aria-label="Kategori dan penyimpanan">
              <h2 className="mb-3 text-sm font-semibold text-[var(--y-text)]">Arsip per kategori</h2>
              {topCategories.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--y-text-dim)]">Belum ada data kategori.</p>
              ) : (
                <ul className="space-y-2.5">
                  {topCategories.map(([name, count]) => (
                    <li key={name}>
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="truncate font-medium text-[var(--y-text)]">{name}</span>
                        <span className="tnum text-[var(--y-text-dim)]">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--y-bg-hover)]">
                        <div className="h-full rounded-full bg-[var(--y-accent)]" style={{ width: `${Math.round((count / maxCat) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <h2 className="mb-2 mt-5 text-sm font-semibold text-[var(--y-text)]">Status penyimpanan</h2>
              <p className="tnum text-[13px] text-[var(--y-text-dim)]">
                {formatBytes(pool.used)} dari {formatBytes(pool.total)} terpakai ({poolPct}%) · {pool.accounts} akun
              </p>
              <button
                onClick={() => setView("penyimpanan")}
                className="y-focus mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--y-primary)] hover:underline"
              >
                Kelola penyimpanan <ArrowRight size={14} />
              </button>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
