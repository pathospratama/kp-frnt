// src/lib/oauth-broadcast.ts
/**
 * Broadcast hasil OAuth ke parent window via 3 mekanisme redundan:
 * 1. window.opener.postMessage (primary)
 * 2. localStorage (cross-tab storage event)
 * 3. BroadcastChannel (modern API)
 *
 * Semua dijalankan sekaligus untuk redundancy — parent tinggal
 * listen salah satu yang tersedia.
 *
 * Dipakai di callback page (/drives dan /oauth-callback) setelah
 * Google OAuth redirect balik ke aplikasi.
 */

const OAUTH_CHANNEL_NAME = "yudit:oauth-channel";
const OAUTH_STORAGE_KEY = "yudit:oauth-result";

export interface OAuthBroadcastPayload {
  success: boolean;
  error?: string;
}

export function broadcastOAuthResult(payload: OAuthBroadcastPayload): void {
  const message = {
    type: "yudit:oauth",
    success: payload.success,
    error: payload.error,
  };

  // ---------- 1. postMessage to opener ----------
  if (typeof window !== "undefined" && window.opener) {
    try {
      window.opener.postMessage(message, "*");
    } catch (err) {
      // Cross-origin access might throw → skip
      // eslint-disable-next-line no-console
      console.warn("[oauth-broadcast] postMessage failed:", err);
    }
  }

  // ---------- 2. localStorage storage event ----------
  // Catatan: event 'storage' TIDAK fire di tab yang sama (by spec).
  // Parent tab yang listen akan dengar event ini.
  try {
    localStorage.setItem(OAUTH_STORAGE_KEY, JSON.stringify(message));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[oauth-broadcast] localStorage failed:", err);
  }

  // ---------- 3. BroadcastChannel ----------
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
      channel.postMessage(message);
      // Tutup channel setelah 200ms (cukup untuk deliver)
      setTimeout(() => {
        try {
          channel.close();
        } catch {
          // ignore
        }
      }, 200);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[oauth-broadcast] BroadcastChannel failed:", err);
    }
  }
}
