// src/lib/api/drives.ts
import { api } from "./client";

// =====================================================
// TYPES
// =====================================================
export interface ApiDrive {
  id: string;
  google_email: string;
  display_name: string | null;
  quota_total: number;
  quota_used: number;
  quota_updated_at?: string | null;
  is_active: boolean;
  /** ⭐ Soft-delete flag — backend filter out, tapi sertakan untuk type safety */
  is_deleted?: boolean;
  slot_index: number;
  created_at?: string;
}

export interface PoolSummary {
  total: number;
  used: number;
  free: number;
  accounts: number;
}

export interface RefreshQuotaResponse {
  message: string;
  pool: PoolSummary;
}

export interface DisconnectDriveResponse {
  message: string;
  soft_delete: boolean;
  hidden_file_count: number;
  google_email?: string;
}

// =====================================================
// LIST DRIVES (backend excludes soft-deleted)
// =====================================================
export async function listDrives(): Promise<ApiDrive[]> {
  const { data } = await api.get<ApiDrive[]>("/drives/");
  return data;
}

// =====================================================
// POOL SUMMARY
// =====================================================
export async function getPoolSummary(): Promise<PoolSummary> {
  const { data } = await api.get<PoolSummary>("/drives/pool");
  return data;
}

// =====================================================
// FORCE REFRESH QUOTA
// =====================================================
export async function forceRefreshQuota(): Promise<RefreshQuotaResponse> {
  const { data } = await api.post<RefreshQuotaResponse>("/drives/refresh-quota");
  return data;
}

// =====================================================
// DISCONNECT DRIVE (soft-delete support)
// =====================================================
/**
 * Hapus akun Drive dari workspace.
 *
 * @param driveId - ID drive
 * @param force - Kalau true: hapus meskipun ada file (soft-delete + hide files).
 *                Kalau false: akan error 400 kalau masih ada file.
 */
export async function disconnectDrive(
  driveId: string,
  force = false,
): Promise<DisconnectDriveResponse> {
  const { data } = await api.delete<DisconnectDriveResponse>(
    `/drives/${driveId}`,
    { params: force ? { force: true } : {} },
  );
  return data;
}