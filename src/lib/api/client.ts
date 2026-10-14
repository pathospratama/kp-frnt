// src/lib/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

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
  timeout: 120_000, // 2 menit — upload file besar
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
const PUBLIC_PATHS = ["/share/", "/auth/login", "/auth/register"];

function isPublicPath(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_PATHS.some((p) => url.includes(p));
}

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
      getToken()
    ) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("yudit:unauthorized"));
      }
    }

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