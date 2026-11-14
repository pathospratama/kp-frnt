// src/app/transfer/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

const TransferView = dynamic(
  () =>
    import("@/components/yudit/transfer/transfer-view").then(
      (m) => m.TransferView,
    ),
  { ssr: false },
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