// src/app/oauth-callback/page.tsx
"use client";

import { useEffect } from "react";

export default function OAuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    const payload = {
      type: "yudit:oauth",
      success: !!success,
      error: error || undefined,
    };

    if (window.opener) {
      window.opener.postMessage(payload, "*");
      window.close();
    } else {
      // Kalau bukan popup, redirect ke /drives
      window.location.href = `/drives?${params.toString()}`;
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