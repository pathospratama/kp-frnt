// Komponen state generik: loading, kosong, error, badge demo.
import { FileSearch, TriangleAlert, FlaskConical } from "lucide-react";

export function LoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)]" aria-busy="true" aria-label="Memuat arsip">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-[var(--y-border-soft)] px-4 py-3 last:border-0">
          <div className="h-10 w-10 rounded-lg bg-[var(--y-bg-elev-2)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-2/3 rounded bg-[var(--y-bg-elev-2)]" />
            <div className="h-3 w-1/3 rounded bg-[var(--y-bg-elev-2)]" />
          </div>
          <div className="hidden h-6 w-20 rounded-full bg-[var(--y-bg-elev-2)] sm:block" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title = "Belum ada arsip yang sesuai dengan pencarian.",
  hint,
  action,
}: {
  title?: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-[var(--y-border)] bg-[var(--y-bg-elev)] px-6 py-14 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-[var(--y-bg-elev-2)]">
        <FileSearch size={22} className="text-[var(--y-text-dim)]" />
      </div>
      <p className="max-w-sm text-sm font-medium text-[var(--y-text)]">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-[13px] text-[var(--y-text-dim)]">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="grid place-items-center rounded-xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-6 py-14 text-center" role="alert">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-red-50">
        <TriangleAlert size={22} className="text-[var(--y-danger)]" />
      </div>
      <p className="max-w-sm text-sm font-medium text-[var(--y-text)]">Arsip gagal dimuat.</p>
      <p className="mt-1 max-w-sm text-[13px] text-[var(--y-text-dim)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="y-focus mt-4 h-9 rounded-lg bg-[var(--y-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--y-primary-hover)]"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}

/** Badge penanda data demo — jangan pernah tampil di produksi. */
export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
      <FlaskConical size={13} />
      Data demo
    </span>
  );
}
