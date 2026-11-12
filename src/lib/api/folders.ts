// src/lib/api/folders.ts
import { api } from "./client";

export interface FolderItem {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  file_count: number;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface CreateFolderPayload {
  name: string;
  parent_id?: string | null;
}

export interface FolderFilesResponse {
  folder: FolderItem;
  breadcrumb: BreadcrumbItem[];
  files: any[]; // FileItem[] — diimport dari store
}

export async function listFolders(parentId?: string | null): Promise<FolderItem[]> {
  const { data } = await api.get<FolderItem[]>("/folders/", {
    params: parentId ? { parent_id: parentId } : {},
  });
  return data;
}

export async function getFolder(folderId: string): Promise<{
  folder: FolderItem;
  breadcrumb: BreadcrumbItem[];
}> {
  const { data } = await api.get(`/folders/${folderId}`);
  return data;
}

export async function createFolder(
  payload: CreateFolderPayload,
): Promise<{ message: string; folder: FolderItem }> {
  const { data } = await api.post("/folders/", payload);
  return data;
}

export async function renameFolder(
  folderId: string,
  name: string,
): Promise<{ message: string; folder: FolderItem }> {
  const { data } = await api.patch(`/folders/${folderId}`, { name });
  return data;
}

export async function deleteFolder(folderId: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/folders/${folderId}`);
  return data;
}

// ⭐ Get files in specific folder
export async function listFilesInFolder(
  folderId: string,
): Promise<FolderFilesResponse> {
  const { data } = await api.get(`/files/in-folder/${folderId}`);
  return data;
}
