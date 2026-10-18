// Header halaman: judul + deskripsi singkat + aksi opsional.
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-[var(--y-text)] sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--y-text-dim)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
