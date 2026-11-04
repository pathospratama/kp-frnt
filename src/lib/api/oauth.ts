// src/lib/api/oauth.ts
import { api } from "./client";

// =====================================================
// TYPES
// =====================================================
export interface OAuthResult {
  ok: boolean;
  error?: string;
  /** Error code yang mungkin:
   *  - "cancelled"         → user tutup popup manual
   *  - "popup_blocked"     → popup diblokir browser
   *  - "timeout"           → 5 menit tidak ada respons
   *  - "max_accounts"      → batas akun tercapai
   *  - "duplicate_account" → email Google sudah pernah connect
   *  - "no_refresh_token"  → Google tidak kirim refresh token
   *  - "invalid_state"     → state JWT tidak valid
   *  - "network_error"     → gagal fetch auth_url
   *  - <lainnya>           → pesan error dari server
   */
}

// =====================================================
// CONSTANTS
// =====================================================
const OAUTH_CHANNEL_NAME = "yudit:oauth-channel";
const OAUTH_STORAGE_KEY = "yudit:oauth-result";
const MAX_WAIT_MS = 5 * 60 * 1000; // 5 menit

// =====================================================
// GET AUTH URL
// =====================================================
export async function getGoogleConnectUrl(): Promise<string> {
  const { data } = await api.get<{ auth_url: string }>("/oauth/google/connect");
  return data.auth_url;
}

// =====================================================
// CONNECT GOOGLE DRIVE (via popup OAuth)
// =====================================================
/**
 * Buka popup Google OAuth, tunggu sampai callback redirect.
 *
 * Strategi komunikasi cross-window (3 mekanisme redundan):
 * 1. postMessage (primary, paling cepat)
 * 2. BroadcastChannel (fallback modern browser)
 * 3. localStorage storage event (fallback paling kompatibel)
 *
 * ⚠️ CATATAN: window.closed TIDAK dipakai sebagai primary signal
 * karena COOP memblokir di Chrome ketika popup masih di cross-origin
 * (accounts.google.com). Polling tetap ada tapi SUPPRESS error noise.
 */
export function connectGoogleDrive(): Promise<OAuthResult> {
  return new Promise(async (resolve) => {
    let resolved = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let broadcastChannel: BroadcastChannel | null = null;
    let storageHandler: ((e: StorageEvent) => void) | null = null;
    let messageHandler: ((e: MessageEvent) => void) | null = null;
    let currentPopup: Window | null = null;

    const cleanup = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (broadcastChannel) {
        try {
          broadcastChannel.close();
        } catch {
          // ignore
        }
        broadcastChannel = null;
      }
      if (storageHandler) {
        window.removeEventListener("storage", storageHandler);
        storageHandler = null;
      }
      if (messageHandler) {
        window.removeEventListener("message", messageHandler);
        messageHandler = null;
      }
      try {
        currentPopup?.close();
      } catch {
        // ignore — mungkin COOP block
      }
    };

    const finish = (result: OAuthResult) => {
      if (resolved) return;
      resolved = true;

      // Clear storage key agar event berikutnya tidak memicu resolve
      try {
        localStorage.removeItem(OAUTH_STORAGE_KEY);
      } catch {
        // ignore
      }

      cleanup();
      resolve(result);
    };

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
      const width =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        screen.width;
      const height =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        screen.height;
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

      // ---- 3. Listener: postMessage (primary) ----
      messageHandler = (e: MessageEvent) => {
        if (!e.data || e.data.type !== "yudit:oauth") return;
        finish({
          ok: !!e.data.success,
          error: e.data.error || undefined,
        });
      };
      window.addEventListener("message", messageHandler);

      // ---- 4. Listener: storage event (cross-tab fallback) ----
      storageHandler = (e: StorageEvent) => {
        if (e.key !== OAUTH_STORAGE_KEY || !e.newValue) return;
        try {
          const payload = JSON.parse(e.newValue);
          if (payload?.type !== "yudit:oauth") return;
          finish({
            ok: !!payload.success,
            error: payload.error || undefined,
          });
        } catch {
          // ignore parse error
        }
      };
      window.addEventListener("storage", storageHandler);

      // ---- 5. Listener: BroadcastChannel (modern fallback) ----
      if (typeof BroadcastChannel !== "undefined") {
        try {
          broadcastChannel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
          broadcastChannel.onmessage = (msg) => {
            if (!msg.data || msg.data.type !== "yudit:oauth") return;
            finish({
              ok: !!msg.data.success,
              error: msg.data.error || undefined,
            });
          };
        } catch {
          // BroadcastChannel not available — abaikan, fallback ke 2 channel lain
        }
      }

      // ---- 6. Polling: deteksi popup ditutup manual ----
      // window.closed TIDAK reliable karena COOP, tapi tetap dipakai
      // dengan try/catch DEFENSIVE untuk deteksi user cancel.
      const startTime = Date.now();

      pollTimer = setInterval(() => {
        // Batas maksimal — hindari memory leak
        if (Date.now() - startTime > MAX_WAIT_MS) {
          finish({ ok: false, error: "timeout" });
          return;
        }

        try {
          // Kalau COOP block, ini throw → catch → abaikan
          // Kalau berhasil dicek dan popup sudah tutup → cancelled
          if (!popup || popup.closed) {
            // Delay kecil untuk handle race dengan postMessage yang telat
            setTimeout(() => {
              finish({ ok: false, error: "cancelled" });
            }, 600);
          }
        } catch {
          // COOP block — abaikan, tetap polling.
          // User kemungkinan masih di halaman Google.
        }
      }, 1000);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Gagal membuka OAuth popup";
      finish({ ok: false, error: msg });
    }
  });
}
