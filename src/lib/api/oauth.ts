// src/lib/api/oauth.ts
import { api } from "./client";

// =====================================================
// GET AUTH URL
// =====================================================
export async function getGoogleConnectUrl(): Promise<string> {
  const { data } = await api.get<{ auth_url: string }>("/oauth/google/connect");
  return data.auth_url;
}

// =====================================================
// RESULT TYPE
// =====================================================
export interface OAuthResult {
  ok: boolean;
  error?: string;
  /** Error code yang mungkin: 
   *  - "cancelled"         → user tutup popup manual
   *  - "popup_blocked"     → popup diblokir browser
   *  - "max_accounts"      → batas akun tercapai (kalau di-set)
   *  - "duplicate_account" → email Google sudah pernah connect
   *  - "no_refresh_token"  → Google tidak kirim refresh token
   *  - "invalid_state"     → state JWT tidak valid
   *  - "network_error"     → gagal fetch auth_url
   *  - <lainnya>           → pesan error dari server
   */
}

// =====================================================
// CONNECT GOOGLE DRIVE (via popup OAuth)
// =====================================================
/**
 * Buka popup Google OAuth, tunggu sampai callback redirect.
 *
 * Backend akan redirect ke salah satu URL:
 *   - `{FRONTEND_URL}/drives?success=connected`
 *   - `{FRONTEND_URL}/drives?error=max_accounts`
 *   - `{FRONTEND_URL}/drives?error=duplicate_account`
 *   - `{FRONTEND_URL}/drives?error=no_refresh_token`
 *
 * Frontend (halaman `/drives` atau oauth-callback) akan
 * mengirim `postMessage` dengan payload:
 *   `{ type: "yudit:oauth", success: boolean, error?: string }`
 *
 * Function ini listen `message` event sampai menerima payload,
 * atau sampai popup ditutup manual.
 */
export function connectGoogleDrive(): Promise<OAuthResult> {
  return new Promise(async (resolve) => {
    let resolved = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const cleanup = (popup?: Window | null) => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      window.removeEventListener("message", handler);
      try {
        popup?.close();
      } catch {
        // ignore
      }
    };

    const finish = (result: OAuthResult, popup?: Window | null) => {
      if (resolved) return;
      resolved = true;
      cleanup(popup);
      resolve(result);
    };

    // ---- Message handler (dari callback page) ----
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.type !== "yudit:oauth") return;
      finish(
        {
          ok: !!e.data.success,
          error: e.data.error || undefined,
        },
        currentPopup,
      );
    };

    let currentPopup: Window | null = null;

    try {
      // ---- 1. Ambil auth_url dari backend ----
      const url = await getGoogleConnectUrl();
      if (!url) {
        finish({ ok: false, error: "auth_url tidak ditemukan" });
        return;
      }

      // ---- 2. Buka popup ----
      const w = 520;
      const h = 640;
      const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
      const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
      const width = window.innerWidth || document.documentElement.clientWidth || screen.width;
      const height = window.innerHeight || document.documentElement.clientHeight || screen.height;
      const left = width / 2 - w / 2 + dualScreenLeft;
      const top = height / 2 - h / 2 + dualScreenTop;

      const popup = window.open(
        url,
        "google-oauth-yudit",
        `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`,
      );

      currentPopup = popup;

      if (!popup) {
        finish({ ok: false, error: "popup_blocked" });
        return;
      }

      // ---- 3. Listen message ----
      window.addEventListener("message", handler);

      // ---- 4. Polling: cek apakah popup ditutup manual ----
      pollTimer = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            // Popup ditutup. Beri sedikit delay untuk handle race condition
            // (kalau postMessage datang terlambat).
            setTimeout(() => {
              finish({ ok: false, error: "cancelled" }, popup);
            }, 300);
          }
        } catch {
          // Cross-origin error (biasanya karena popup masih di halaman Google)
          // → skip cek, cek di iterasi berikutnya
        }
      }, 800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal membuka OAuth";
      finish({ ok: false, error: msg });
    }
  });
}