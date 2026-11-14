// src/app/scan/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { RequireAuth } from "@/components/yudit/auth/require-auth";

const CamScannerView = dynamic(
  () =>
    import("@/components/yudit/scan/cam-scanner-view").then(
      (m) => m.CamScannerView,
    ),
  { ssr: false },
);

export default function ScanPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="yudit-ambient grid min-h-screen place-items-center">
            <Loader2
              size={28}
              className="animate-spin text-[var(--y-primary)]"
            />
          </div>
        }
      >
        <CamScannerView />
      </Suspense>
    </RequireAuth>
  );
}
