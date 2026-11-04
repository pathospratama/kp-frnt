// src/app/oauth-callback/page.tsx
"use client";

import { useEffect } from "react";
import { broadcastOAuthResult } from "@/lib/oauth-broadcast";

export default function OAuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    // ⭐ Broadcast via 3 channel sekaligus
    broadcastOAuthResult({
      success: !!success,
      error: error || undefined,
    });

    // Kalau di popup → close. Delay kecil agar broadcast sampai.
    if (window.opener) {
      setTimeout(() => {
        try {
          window.close();
        } catch {
          // COOP block — abaikan
        }
      }, 400);
    } else {
      // Bukan popup → redirect ke /drives
      setTimeout(() => {
        window.location.href = `/drives?${params.toString()}`;
      }, 400);
    }
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--y-bg)]">
      <div className="text-center">
        <div className="mb-3 text-2xl">🔐</div>
        <div className="text-sm text-[var(--y-text-dim)]">
          Menyelesaikan autentikasi Google…
        </div>
      </div>
    </div>
  );
}
