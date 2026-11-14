// src/app/transfer/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2, AlertCircle } from "lucide-react";

const TransferView = dynamic(
  () =>
    import("@/components/yudit/transfer/transfer-view")
      .then((m) => {
        if (!m.TransferView) {
          throw new Error("Export `TransferView` tidak ditemukan di modul");
        }
        return { default: m.TransferView };
      })
      .catch((err: Error) => {
        console.error("[transfer/page] dynamic import gagal:", err);
        return {
          default: () => (
            <div className="yudit-ambient grid min-h-screen place-items-center p-5">
              <div className="max-w-md rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-6 text-center">
                <AlertCircle
                  size={32}
                  className="mx-auto mb-3 text-[var(--y-danger)]"
                />
                <h2 className="text-base font-bold text-[var(--y-text)]">
                  Gagal Memuat Halaman
                </h2>
                <p className="mt-2 break-words text-sm text-[var(--y-text-dim)]">
                  {err?.message ||
                    "Terjadi kesalahan saat memuat modul transfer."}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-xs font-semibold text-[var(--y-text)] hover:bg-[var(--y-bg-hover)]"
                >
                  Reload Halaman
                </button>
              </div>
            </div>
          ),
        };
      }),
  {
    ssr: false,
    loading: () => (
      <div className="yudit-ambient grid min-h-screen place-items-center">
        <Loader2 size={28} className="animate-spin text-[var(--y-primary)]" />
      </div>
    ),
  },
);

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <div className="yudit-ambient grid min-h-screen place-items-center">
          <Loader2 size={28} className="animate-spin text-[var(--y-primary)]" />
        </div>
      }
    >
      <TransferView />
    </Suspense>
  );
}
