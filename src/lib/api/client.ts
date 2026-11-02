// frontend/src/lib/api/client.ts
/**
 * Axios API client.
 *
 * Semua URL dibaca dari `process.env.NEXT_PUBLIC_API_URL`.
 * TIDAK ada hardcode domain.
 *
 * Fitur:
 * - Auto-attach Bearer token
 * - Auto-logout saat 401 JWT (bukan Drive)
 * - Deteksi Drive auth error via header & message (CORS-safe)
 * - Parse error dari Blob & JSON
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// =====================================================
// ENV — WAJIB DI-SET
// =====================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  // Jangan throw saat build — hanya warn. Throw akan bikin halaman blank.
  // eslint-disable-next-line no-console
  console.error(
    "[yudit/api] ❌ NEXT_PUBLIC_API_URL is not set. " +
      "Set it in .env.local (dev) or Vercel Environment Variables (prod).",
  );
}

export const API_BASE_URL = (API_URL || "").trim().replace(/\/$/, "");

// =====================================================
// STORAGE KEYS
// =====================================================
export const TOKEN_KEY = "yudit_token";
export const USER_KEY = "yudit_user";

// =====================================================
// AXIOS INSTANCE
// =====================================================
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: false, // Bearer token, bukan cookie
});

// =====================================================
// TOKEN & USER STORAGE
// =====================================================
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =====================================================
// HELPERS
// =====================================================
const PUBLIC_PATHS = ["/share/", "/auth/login", "/auth/register"];

function isPublicPath(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_PATHS.some((p) => url.includes(p));
}

/**
 * Extract error detail — handle JSON, string, dan Blob.
 */
async function extractErrorDetail(data: unknown): Promise<string> {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (typeof data === "object" && !(data instanceof Blob)) {
    const obj = data as Record<string, unknown>;
    return String(obj.detail || obj.message || "");
  }
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      try {
        const json = JSON.parse(text) as { detail?: string; message?: string };
        return String(json?.detail || json?.message || text);
      } catch {
        return text;
      }
    } catch {
      return "";
    }
  }
  return "";
}

/**
 * Deteksi pesan error Google Drive (fallback CORS-safe).
 */
function looksLikeDriveAuthMessage(detail: string): boolean {
  if (!detail) return false;
  const lower = detail.toLowerCase();
  return (
    lower.includes("reconnect") ||
    lower.includes("refresh token") ||
    lower.includes("revoked") ||
    (lower.includes("google drive") &&
      (lower.includes("tidak valid") ||
        lower.includes("dinonaktifkan") ||
        lower.includes("invalid")))
  );
}

// =====================================================
// ApiError CLASS
// =====================================================
export class ApiError extends Error {
  status: number;
  detail: string;
  isDriveError?: boolean;
  driveEmail?: string;
  driveId?: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<unknown>) => {
    const url = error.config?.url;
    const status = error.response?.status || 0;
    const headers = (error.response?.headers || {}) as Record<string, string>;

    // ⭐ Kalau tidak ada response (network error / CORS / timeout)
    if (!error.response) {
      const msg =
        error.code === "ECONNABORTED"
          ? "Request timeout — server tidak merespons."
          : "Tidak bisa terhubung ke server. Periksa koneksi atau CORS.";
      // eslint-disable-next-line no-console
      console.error("[yudit/api] Network error:", error.message, url);
      return Promise.reject(new ApiError(0, msg));
    }

    // Extract detail
    const detail =
      (await extractErrorDetail(error.response.data)) ||
      error.message ||
      "Terjadi kesalahan";

    // Deteksi drive error
    const headerDriveError =
      headers["x-drive-error"] === "reconnect_required";
    const messageDriveError =
      status === 401 && looksLikeDriveAuthMessage(detail);
    const isDriveError = headerDriveError || messageDriveError;

    // Auto-logout HANYA kalau 401 JWT (bukan Drive, bukan public)
    if (status === 401 && !isPublicPath(url) && !isDriveError && getToken()) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("yudit:unauthorized"));
      }
    }

    // Attach flags
    const apiError = new ApiError(status, String(detail));
    if (isDriveError) {
      apiError.isDriveError = true;
      apiError.driveEmail = headers["x-drive-email"] || "";
      apiError.driveId = headers["x-drive-id"] || "";
    }

    return Promise.reject(apiError);
  },
);

// =====================================================
// URL HELPER
// =====================================================
export function getApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  if (!API_BASE_URL) {
    throw new ApiError(
      0,
      "NEXT_PUBLIC_API_URL belum diset. Cek Environment Variables di Vercel.",
    );
  }
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
