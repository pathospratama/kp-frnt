// src/lib/api/scan.ts
import { api } from "./client";

export type OutputFormat = "pdf" | "docx" | "jpg" | "png";
export type PageSize = "A4" | "A3" | "Letter" | "Legal" | "auto";
export type FilterType = "none" | "enhance" | "bw" | "grayscale" | "magic";
export type SessionStatus =
  | "draft" | "processing" | "completed" | "failed" | "cancelled";

export interface ScanPage {
  id: string;
  session_id: string;
  page_order: number;
  original_order: number;
  original_storage_path: string;
  edited_storage_path: string | null;
  original_width: number | null;
  original_height: number | null;
  original_size: number | null;
  mime_type: string | null;
  edit_operations: Array<Record<string, unknown>>;
  filter_applied: FilterType | null;
  created_at: string;
  updated_at: string;
  preview_url: string | null;
}

export interface ScanSession {
  id: string;
  user_id: string;
  owner_id: string;
  title: string;
  status: SessionStatus;
  output_format: OutputFormat;
  page_size: PageSize;
  quality: number;
  result_file_id: string | null;
  result_size: number | null;
  page_count: number;
  error_message: string | null;
  provider: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  pages?: ScanPage[];
}

export async function createScanSession(payload: {
  title?: string;
  output_format?: OutputFormat;
  page_size?: PageSize;
  quality?: number;
}): Promise<ScanSession> {
  const { data } = await api.post("/scan/sessions", payload);
  return data;
}

export async function listScanSessions(limit = 30): Promise<ScanSession[]> {
  const { data } = await api.get("/scan/sessions", { params: { limit } });
  return data;
}

export async function getScanSession(id: string): Promise<ScanSession> {
  const { data } = await api.get(`/scan/sessions/${id}`);
  return data;
}

export async function updateScanSession(
  id: string,
  patch: Partial<Pick<ScanSession, "title" | "output_format" | "page_size" | "quality">>,
): Promise<ScanSession> {
  const { data } = await api.patch(`/scan/sessions/${id}`, patch);
  return data;
}

export async function deleteScanSession(id: string): Promise<void> {
  await api.delete(`/scan/sessions/${id}`);
}

export async function uploadScanPage(
  sessionId: string,
  file: Blob,
  originalOrder = 0,
  onProgress?: (pct: number) => void,
): Promise<ScanPage> {
  const form = new FormData();
  const fname = file instanceof File ? file.name : `capture_${Date.now()}.jpg`;
  form.append("file", file, fname);
  form.append("original_order", String(originalOrder));

  const { data } = await api.post(
    `/scan/sessions/${sessionId}/pages`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
      timeout: 120_000,
    },
  );
  return data;
}

export async function updateScanPage(
  sessionId: string,
  pageId: string,
  patch: {
    page_order?: number;
    edit_operations?: Array<Record<string, unknown>>;
    filter_applied?: FilterType | null;
  },
): Promise<ScanPage> {
  const { data } = await api.patch(
    `/scan/sessions/${sessionId}/pages/${pageId}`,
    patch,
  );
  return data;
}

export async function deleteScanPage(
  sessionId: string,
  pageId: string,
): Promise<void> {
  await api.delete(`/scan/sessions/${sessionId}/pages/${pageId}`);
}

export async function reorderScanPages(
  sessionId: string,
  pageIds: string[],
): Promise<ScanPage[]> {
  const { data } = await api.post(
    `/scan/sessions/${sessionId}/pages/reorder`,
    { page_ids: pageIds },
  );
  return data;
}

export async function processScanSession(
  sessionId: string,
  options?: {
    output_format?: OutputFormat;
    page_size?: PageSize;
    quality?: number;
    folder_id?: string | null;
    category?: string | null;
    use_ilovepdf?: boolean;
  },
): Promise<{
  session_id: string;
  status: string;
  result_file: any;
  drive_email: string;
  folder_name: string;
}> {
  const { data } = await api.post(
    `/scan/sessions/${sessionId}/process`,
    options || {},
    { timeout: 300_000 },
  );
  return data;
}