// src/lib/api/docs.ts
import { api } from "./client";

export interface DocOpenResponse {
  file: {
    id: string;
    name: string;
    size: number;
    mime_type: string | null;
    drive_account_id: string;
  };
  html: string;
  messages: { type: string; message: string }[];
  version: number;
  content_hash: string;
  editor_mode: "local" | "google_docs";
}

export interface DocSaveResponse {
  file: { id: string; name: string; size: number; content_hash: string };
  saved_as_new: boolean;
  version: number;
}

export interface DocVersion {
  id: string;
  version_number: number;
  content_hash: string;
  editor_mode: string;
  created_at: string;
  created_by: string | null;
}

export async function openDoc(fileId: string): Promise<DocOpenResponse> {
  const { data } = await api.get<DocOpenResponse>(`/docs/${fileId}`);
  return data;
}

export async function saveDoc(
  fileId: string,
  html: string,
  expectedHash?: string,
  saveAsNew = false,
): Promise<DocSaveResponse> {
  const { data } = await api.patch<DocSaveResponse>(`/docs/${fileId}`, {
    html,
    expected_hash: expectedHash,
    save_as_new: saveAsNew,
  });
  return data;
}

export async function listDocVersions(fileId: string): Promise<DocVersion[]> {
  const { data } = await api.get<DocVersion[]>(`/docs/${fileId}/versions`);
  return data;
}

export async function getDocVersion(fileId: string, versionNumber: number) {
  const { data } = await api.get(`/docs/${fileId}/versions/${versionNumber}`);
  return data;
}

export async function restoreDocVersion(
  fileId: string,
  versionNumber: number,
): Promise<DocSaveResponse> {
  const { data } = await api.post(
    `/docs/${fileId}/versions/${versionNumber}/restore`,
  );
  return data;
}

export async function uploadDocImage(
  fileId: string,
  file: File,
): Promise<{ url: string }> {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post<{ url: string }>(
    `/docs/${fileId}/upload-image`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

// src/lib/api/docs.ts — TAMBAH di bagian bawah

// =====================================================
// GOOGLE DOCS NATIVE
// =====================================================
export interface GoogleDocInfo {
  google_doc_id: string;
  web_view_link: string;
  embed_url: string;
  edit_url: string;
  name: string;
  existing: boolean;
}

export async function convertToGoogleDoc(
  fileId: string,
  newName?: string,
): Promise<GoogleDocInfo> {
  const { data } = await api.post<GoogleDocInfo>(
    `/docs/${fileId}/convert-to-gdoc`,
    { new_name: newName, save_to_db: true },
    { timeout: 60_000 },
  );
  return data;
}

export async function getGoogleDocInfo(
  fileId: string,
): Promise<GoogleDocInfo> {
  const { data } = await api.get<GoogleDocInfo>(
    `/docs/${fileId}/google-doc-info`,
  );
  return data;
}

export async function syncFromGoogleDoc(
  fileId: string,
): Promise<{ file: unknown; synced: boolean }> {
  const { data } = await api.post(
    `/docs/${fileId}/sync-from-gdoc`,
    {},
    { timeout: 60_000 },
  );
  return data;
}
export async function fetchRawDocx(fileId: string): Promise<Blob> {
  const { data } = await api.get(`/docs/${fileId}/raw`, {
    responseType: "blob",
    timeout: 60_000,
  });
  return data;
}
export async function deleteGoogleDoc(fileId: string): Promise<void> {
  await api.delete(`/docs/${fileId}/google-doc`);
}