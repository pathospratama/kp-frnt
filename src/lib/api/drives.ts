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

// =====================================================
// LIST DRIVES
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
// FORCE REFRESH QUOTA (user trigger manual)
// =====================================================
export async function forceRefreshQuota(): Promise<RefreshQuotaResponse> {
  const { data } = await api.post<RefreshQuotaResponse>("/drives/refresh-quota");
  return data;
}

// =====================================================
// DISCONNECT DRIVE
// =====================================================
export async function disconnectDrive(driveId: string): Promise<void> {
  await api.delete(`/drives/${driveId}`);
}