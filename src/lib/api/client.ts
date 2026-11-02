// src/lib/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

<<<<<<< HEAD
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
=======
// =====================================================
// API URL dari ENV — TIDAK ADA HARDCODED FALLBACK
// =====================================================
// Priority:
//   1. NEXT_PUBLIC_API_URL (dari .env / Vercel env vars)
//   2. Throw error di runtime kalau tidak di-set (build akan fail, itu bagus)
//
// JANGAN hardcode "http://localhost:8000" di sini.
// Set di:
//   - .env.local          → development
//   - Vercel Dashboard    → production (Settings > Environment Variables)

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  // Di build time, ini akan warning tapi tidak error.
  // Di runtime, ini akan throw saat pertama kali API dipanggil.
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  console.warn(
    "[yudit] NEXT_PUBLIC_API_URL is not set. " +
      "Please set it in your environment variables.",
  );
}

export const API_BASE_URL = API_URL || "";

export const TOKEN_KEY = "yudit_token";
export const USER_KEY = "yudit_user";

export const api = axios.create({
  baseURL: API_BASE_URL,
<<<<<<< HEAD
  timeout: 120_000,
=======
  timeout: 120_000, // 2 menit — upload file besar
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
  headers: { "Content-Type": "application/json" },
});

// =====================================================
// TOKEN STORAGE
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
<<<<<<< HEAD
// HELPERS
// =====================================================

// Endpoint yang TIDAK boleh trigger auto-logout
=======
// RESPONSE INTERCEPTOR
// =====================================================
export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

// Endpoint yang TIDAK boleh trigger auto-logout (public endpoints)
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
const PUBLIC_PATHS = ["/share/", "/auth/login", "/auth/register"];

function isPublicPath(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_PATHS.some((p) => url.includes(p));
}

<<<<<<< HEAD
/**
 * Parse error body — bisa JSON object ATAU Blob (dari responseType: "blob").
 */
async function extractErrorDetail(data: any): Promise<string> {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (typeof data === "object" && !(data instanceof Blob)) {
    return String(data.detail || data.message || "");
  }
  // Blob → baca sebagai text lalu coba parse JSON
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      try {
        const json = JSON.parse(text);
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
 * Deteksi drive auth error dari ISI PESAN.
 *
 * Ini adalah fallback ketika header `X-Drive-Error` terblokir CORS
 * (karena backend belum set `expose_headers`). Sangat penting untuk
 * mencegah auto-logout user ketika hanya token Google Drive yang
 * expired/revoked — JWT user masih valid.
 *
 * Pesan backend yang kita deteksi:
 *  - "... Reconnect Google Drive di menu 'Google Drive' ..."
 *  - "Refresh token Google Drive sudah tidak valid (revoked) ..."
 *  - "Akun Google Drive <email> sudah dinonaktifkan ..."
 *  - "...refresh token revoked..."
 */
function looksLikeDriveAuthMessage(detail: string): boolean {
  if (!detail) return false;
  const lower = detail.toLowerCase();
  if (lower.includes("reconnect")) return true;
  if (lower.includes("refresh token")) return true;
  if (lower.includes("revoked")) return true;
  if (
    lower.includes("google drive") &&
    (lower.includes("tidak valid") ||
      lower.includes("dinonaktifkan") ||
      lower.includes("invalid"))
  ) {
    return true;
  }
  return false;
}

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const url = error.config?.url;
    const status = error.response?.status || 0;
    const headers = (error.response?.headers || {}) as Record<string, any>;

    // ⭐ Extract detail — support Blob & JSON
    const detail =
      (await extractErrorDetail(error.response?.data)) ||
      error.message ||
      "Terjadi kesalahan";

    // ⭐ Deteksi drive error — DUA sinyal:
    //   1. Header (kalau backend expose_headers)
    //   2. Isi pesan (fallback CORS-safe)
    const headerDriveError =
      headers["x-drive-error"] === "reconnect_required" ||
      headers["X-Drive-Error"] === "reconnect_required";

    const messageDriveError =
      status === 401 && looksLikeDriveAuthMessage(detail);

    const isDriveError = headerDriveError || messageDriveError;

    // ⭐ Auto-logout HANYA kalau 401 JWT user (bukan Drive, bukan public)
    if (
      status === 401 &&
      !isPublicPath(url) &&
      !isDriveError &&
=======
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<any>) => {
    const url = error.config?.url;

    // Hanya auto-logout kalau:
    // 1. Status 401
    // 2. Bukan public endpoint
    // 3. Ada token (artinya user sedang login)
    if (
      error.response?.status === 401 &&
      !isPublicPath(url) &&
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
      getToken()
    ) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("yudit:unauthorized"));
      }
    }

<<<<<<< HEAD
    // ⭐ Attach extra flags ke error object
    const apiError = new ApiError(status, String(detail));
    if (isDriveError) {
      apiError.isDriveError = true;
      apiError.driveEmail = headers["x-drive-email"] || "";
      apiError.driveId = headers["x-drive-id"] || "";
    }

    return Promise.reject(apiError);
  },
);

export class ApiError extends Error {
  status: number;
  detail: string;
  isDriveError?: boolean;
  driveEmail?: string;
  driveId?: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

=======
    const detail =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Terjadi kesalahan";

    return Promise.reject(
      new ApiError(error.response?.status || 0, String(detail)),
    );
  },
);

>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
// =====================================================
// URL HELPER
// =====================================================
export function getApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured. " +
        "Please set it in your environment variables.",
    );
  }
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}