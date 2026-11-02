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
<<<<<<< HEAD
  /** ⭐ Soft-delete flag — backend filter out, tapi sertakan untuk type safety */
  is_deleted?: boolean;
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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

<<<<<<< HEAD
export interface DisconnectDriveResponse {
  message: string;
  soft_delete: boolean;
  hidden_file_count: number;
  google_email?: string;
}

// =====================================================
// LIST DRIVES (backend excludes soft-deleted)
=======
// =====================================================
// LIST DRIVES
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
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
<<<<<<< HEAD
// FORCE REFRESH QUOTA
=======
// FORCE REFRESH QUOTA (user trigger manual)
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
// =====================================================
export async function forceRefreshQuota(): Promise<RefreshQuotaResponse> {
  const { data } = await api.post<RefreshQuotaResponse>("/drives/refresh-quota");
  return data;
}

// =====================================================
<<<<<<< HEAD
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
=======
// DISCONNECT DRIVE
// =====================================================
export async function disconnectDrive(driveId: string): Promise<void> {
  await api.delete(`/drives/${driveId}`);
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
}