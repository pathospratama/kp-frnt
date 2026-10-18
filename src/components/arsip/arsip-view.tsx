// Halaman Arsip — dipakai Pegawai ("Arsip Digital") dan Admin ("Semua Arsip").
// Pencarian sebagai fokus utama; aksi administratif hanya untuk admin.
"use client";

import { useYudit } from "@/lib/yudit/store";
import { fetchFileBlob } from "@/lib/api/files";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { ArchiveFilters } from "./archive-filters";
import { ArchiveTable } from "./archive-table";

export function ArsipView({ admin = false }: { admin?: boolean }) {
  const files = useYudit((s) => s.files);
  const filesLoading = useYudit((s) => s.filesLoading);
  const openPreview = useYudit((s) => s.openPreview);
  const openShare = useYudit((s) => s.openShare);
  const deleteFile = useYudit((s) => s.deleteFile);
  const updateFileCategory = useYudit((s) => s.updateFileCategory);
  const showConfirm = useYudit((s) => s.showConfirm);
  const defaultCategories = useYudit((s) => s.defaultCategories);
  const customCategories = useYudit((s) => s.customCategories);
  const setCategoryManagerOpen = useYudit((s) => s.setCategoryManagerOpen);

  const categories = [
    ...defaultCategories.map((c) => c.name),
    ...customCategories.map((c) => c.name),
  ];

  const handleDownload = async (f: { id: string; name: string }) => {
    try {
      const blob = await fetchFileBlob(f.id, "download");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      toast.error("Unduhan gagal. Silakan coba lagi.");
    }
  };

  const handleDelete = (f: { id: string; name: string }) => {
    showConfirm(
      "Hapus arsip?",
      `“${f.name}” akan dihapus dari penyimpanan. Tindakan ini tidak dapat dibatalkan.`,
      () => deleteFile(f.id),
    );
  };

  return (
    <div>
      <PageHeader
        title={admin ? "Semua Arsip" : "Arsip Digital"}
        description={
          admin
            ? "Kelola seluruh arsip internal Bagian Persidangan: cari, preview, ubah kategori, bagikan, atau hapus."
            : "Temukan arsip internal Bagian Persidangan. Ketik kata kunci, saring, lalu preview sebelum mengunduh."
        }
        actions={
          admin ? (
            <button
              onClick={() => setCategoryManagerOpen(true)}
              className="y-focus h-9 rounded-lg border border-[var(--y-border)] px-3.5 text-sm font-medium text-[var(--y-text)] hover:bg-[var(--y-bg-hover)]"
            >
              Kelola kategori
            </button>
          ) : undefined
        }
      />
      <ArchiveFilters resultCount={files.length} />
      <ArchiveTable
        files={files}
        loading={filesLoading}
        isAdmin={admin}
        categories={categories}
        onPreview={openPreview}
        onDownload={handleDownload}
        onShare={openShare}
        onDelete={(id) => {
          const f = files.find((x) => x.id === id);
          if (f) handleDelete(f);
        }}
        onCategory={updateFileCategory}
      />
    </div>
  );
}
