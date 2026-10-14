// src/lib/api/files.ts
import { api } from "./client";

// =====================================================
// TYPES (mirror backend)
// =====================================================
export interface ApiFile {
  id: string;
  name: string;
  mime_type: string | null;
  size: number;
  folder_id: string | null;
  folder_name: string | null;
  drive_account_id: string;
  remote_file_id: string;
  monthly_folder_id: string | null;
  category: string | null;
  category_confidence: number;
  file_type: string | null;
  year: number;
  month: number;
  day: number;
  is_public: boolean;
  share_token: string | null;
  share_expires_at: string | null;
  share_views: number;
  created_at: string;
  updated_at: string;
}

export interface FileListParams {
  folder_id?: string;
  category?: string;
  search?: string;
  year?: number;
  month?: number;
  day?: number;
  date_from?: string;
  date_to?: string;
  file_type?: string;
  sort_by?: "created_at" | "name" | "size" | "year" | "month";
  sort_order?: "asc" | "desc";
}

export interface StatsResponse {
  total_files: number;
  total_size: number;
  by_category: Record<string, number>;
  by_month: Record<string, number>;
  by_year: Record<string, number>;
  by_day: Record<string, number>;
  by_type: Record<string, number>;
}

export interface CategoryStatsResponse {
  categories: string[];
  counts: Record<string, number>;
}

export interface MonthlyFolder {
  id: string;
  folder_name: string;
  remote_folder_id: string;
  year: number;
  month: number;
  drive_account_id: string;
  drive_accounts?: { google_email: string };
}

export interface UploadResponse {
  message: string;
  file: ApiFile;
  stored_in: string;
  monthly_folder: string;
  category: string | null;
  file_type: string | null;
}

// =====================================================
// LIST
// =====================================================
export async function listFiles(params: FileListParams = {}): Promise<ApiFile[]> {
  const clean: Record<string, string | number> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") clean[k] = v as string | number;
  });
  const { data } = await api.get<ApiFile[]>("/files/", { params: clean });
  return data;
}

// =====================================================
// STATS
// =====================================================
export async function getStats(year?: number): Promise<StatsResponse> {
  const { data } = await api.get<StatsResponse>("/files/stats", {
    params: year ? { year } : {},
  });
  return data;
}

export async function getCategoryStats(): Promise<CategoryStatsResponse> {
  const { data } = await api.get<CategoryStatsResponse>("/files/categories");
  return data;
}

// =====================================================
// MONTHLY FOLDERS
// =====================================================
export async function listMonthlyFolders(): Promise<MonthlyFolder[]> {
  const { data } = await api.get<MonthlyFolder[]>("/files/monthly-folders");
  return data;
}

// =====================================================
// UPLOAD
// =====================================================
export async function uploadFile(
  file: File,
  folderId?: string | null,
  onProgress?: (pct: number) => void,
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  if (folderId) form.append("folder_id", folderId);

  const { data } = await api.post<UploadResponse>("/files/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
}

// =====================================================
// DELETE
// =====================================================
export async function deleteFile(fileId: string): Promise<void> {
  await api.delete(`/files/${fileId}`);
}

export async function bulkDelete(fileIds: string[]): Promise<{
  message: string;
  deleted: number;
  failed: { id: string; error: string }[];
}> {
  const { data } = await api.post("/files/bulk-delete", { file_ids: fileIds });
  return data;
}

// =====================================================
// UPDATE CATEGORY
// =====================================================
export async function updateCategory(
  fileId: string,
  category: string,
): Promise<{ message: string; file: ApiFile }> {
  const { data } = await api.patch(`/files/${fileId}/category`, { category });
  return data;
}

export async function bulkUpdateCategory(
  fileIds: string[],
  category: string,
): Promise<{ message: string; updated: number }> {
  const { data } = await api.post("/files/bulk-category", {
    file_ids: fileIds,
    category,
  });
  return data;
}

export async function reclassify(
  fileId: string,
): Promise<{ message: string; category: string; confidence: number; file: ApiFile }> {
  const { data } = await api.post(`/files/${fileId}/reclassify`);
  return data;
}

// =====================================================
// URL HELPERS (untuk <img>, <video>, download)
// =====================================================
import { getApiUrl, getToken } from "./client";

/**
 * Karena endpoint preview/download butuh Authorization header,
 * kita tidak bisa pakai URL langsung di <img src>. Solusinya:
 * - Fetch sebagai blob via axios → object URL
 * - Atau gunakan token di query (TIDAK direkomendasikan)
 *
 * Di sini kita sediakan helper untuk fetch blob.
 */
export async function fetchFileBlob(
  fileId: string,
  mode: "preview" | "download" = "preview",
): Promise<Blob> {
  const res = await api.get(`/files/${fileId}/${mode}`, {
    responseType: "blob",
  });
  return res.data;
}

export function getFilePreviewUrl(fileId: string): string {
  return getApiUrl(`/files/${fileId}/preview`);
}

export function getFileDownloadUrl(fileId: string): string {
  return getApiUrl(`/files/${fileId}/download`);
}