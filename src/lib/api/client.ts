// src/lib/api/client.ts
/**
 * Axios API client.
 *
 * Semua URL dibaca dari `process.env.NEXT_PUBLIC_API_URL`.
 * TIDAK ada hardcode domain.
 *
 * Fitur:
 * - Auto-attach Bearer token
 * - Auto-logout saat 401 JWT (bukan Drive) dengan THROTTLE
 * - Deteksi Drive auth error via header & message (CORS-safe)
 * - Parse error dari Blob & JSON (termasuk FastAPI validation errors)
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// =====================================================
// ENV — WAJIB DI-SET
// =====================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
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
  withCredentials: false,
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
 * ⭐ Extract error detail — handle JSON, string, Blob, dan FastAPI
 * validation errors (array of {loc, msg, type}).
 */
async function extractErrorDetail(data: unknown): Promise<string> {
  if (!data) return "";
  if (typeof data === "string") return data;

  // Handle Blob (untuk responseType: 'blob')
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      try {
        const json = JSON.parse(text);
        return extractErrorDetail(json);
      } catch {
        return text;
      }
    } catch {
      return "";
    }
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // ⭐ Handle FastAPI validation errors:
    // {"detail": [{"loc": ["body", "email"], "msg": "value is not a valid email", "type": "..."}]}
    if (Array.isArray(obj.detail)) {
      return obj.detail
        .map((item: any) => {
          if (typeof item === "string") return item;
          if (item?.msg) {
            const loc = Array.isArray(item.loc)
              ? item.loc.filter((x: any) => typeof x === "string").slice(-1)[0]
              : "";
            return loc ? `${loc}: ${item.msg}` : item.msg;
          }
          return JSON.stringify(item);
        })
        .join("; ");
    }

    // Handle detail string biasa (FastAPI HTTPException)
    if (typeof obj.detail === "string") return obj.detail;

    // Handle detail object dari backend error format baru
    // { "detail": { "detail": "...", "code": "...", "request_id": "..." } }
    if (typeof obj.detail === "object" && obj.detail !== null) {
      const d = obj.detail as Record<string, unknown>;
      if (typeof d.detail === "string") return d.detail;
      if (typeof d.message === "string") return d.message;
    }

    // Handle message string (custom error format)
    if (typeof obj.message === "string") return obj.message;

    // Fallback: try JSON.stringify supaya tidak hilang
    try {
      const str = JSON.stringify(obj);
      return str.length > 500 ? str.slice(0, 500) + "…" : str;
    } catch {
      return "";
    }
  }

  return "";
}

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
// ⭐ UNAUTHORIZED THROTTLE — cegah spam 401
// =====================================================
let lastUnauthorizedAt = 0;
const UNAUTHORIZED_THROTTLE_MS = 1500; // 1.5 detik

function triggerUnauthorizedOnce() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastUnauthorizedAt < UNAUTHORIZED_THROTTLE_MS) {
    return; // Skip — baru saja logout
  }
  lastUnauthorizedAt = now;
  clearToken();
  window.dispatchEvent(new CustomEvent("yudit:unauthorized"));
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
  code?: string;
  requestId?: string;
  retryAfter?: number;

  constructor(status: number, detail: string, code?: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.code = code;
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
    const requestId = headers["x-request-id"] || undefined;

    if (!error.response) {
      const msg =
        error.code === "ECONNABORTED"
          ? "Request timeout — server tidak merespons."
          : "Tidak bisa terhubung ke server. Periksa koneksi atau CORS.";
      console.error("[yudit/api] Network error:", error.message, url);
      return Promise.reject(new ApiError(0, msg));
    }

    const detail =
      (await extractErrorDetail(error.response.data)) ||
      error.message ||
      "Terjadi kesalahan";

    // Deteksi drive auth error
    const headerDriveError =
      headers["x-drive-error"] === "reconnect_required";
    const messageDriveError =
      status === 401 && looksLikeDriveAuthMessage(detail);
    const isDriveError = headerDriveError || messageDriveError;

    // ⭐ Rate limit handling
    let retryAfter: number | undefined;
    if (status === 429) {
      const ra = headers["retry-after"];
      if (ra) {
        const n = parseInt(ra, 10);
        if (!isNaN(n)) retryAfter = n;
      }
    }

    // ⭐ Auto-logout hanya 401 JWT, bukan Drive, bukan public, dengan THROTTLE
    if (
      status === 401 &&
      !isPublicPath(url) &&
      !isDriveError &&
      getToken()
    ) {
      triggerUnauthorizedOnce();
    }

    const apiError = new ApiError(
      status,
      String(detail),
      headers["x-error-code"] || undefined,
    );
    apiError.requestId = requestId;
    apiError.retryAfter = retryAfter;
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
