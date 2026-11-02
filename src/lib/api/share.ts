// src/lib/api/share.ts
import { api, getApiUrl } from "./client";

export interface ShareCreatePayload {
  file_id: string;
  expires_hours?: number | null;
  password?: string | null;
}

export interface ShareCreateResponse {
  token: string;
  url: string;
  expires_at: string | null;
  has_password: boolean;
}

export interface ShareInfo {
  name: string;
  size: number;
  mime_type: string | null;
  created_at: string;
  has_password: boolean;
  views: number;
}

export async function createShare(
  payload: ShareCreatePayload,
): Promise<ShareCreateResponse> {
  const { data } = await api.post<ShareCreateResponse>("/share/create", payload);
  return data;
}

export async function revokeShare(fileId: string): Promise<void> {
  await api.delete(`/share/${fileId}`);
}

/**
 * URL publik untuk share link — dipakai user untuk share ke orang lain.
 * Mengarah ke halaman frontend /share/[token] (BUKAN API).
 */
export function getShareUrl(token: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base}/share/${token}`;
}

/**
 * URL API untuk download via share token.
 */
export function getShareDownloadUrl(token: string, password?: string): string {
  const q = password ? `?password=${encodeURIComponent(password)}` : "";
  return getApiUrl(`/share/${token}/download${q}`);
}

/**
 * URL API untuk preview via share token.
 */
export function getSharePreviewUrl(token: string, password?: string): string {
  const q = password ? `?password=${encodeURIComponent(password)}` : "";
  return getApiUrl(`/share/${token}/preview${q}`);
}

export async function getShareInfo(token: string): Promise<ShareInfo> {
  const { data } = await api.get<ShareInfo>(`/share/${token}/info`);
  return data;
}