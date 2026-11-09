// src/lib/api/collaborators.ts
import { api, ApiError } from "./client";
import type { Collaborator } from "@/lib/yudit/types";

// =====================================================
// TYPES
// =====================================================
export interface InvitePayload {
  email: string;
  username?: string;
  role: "super_admin" | "member";
}

export interface EmailDeliveryResult {
  sent: boolean;
  status: string;
  code: string;
  stage: string;
  message: string;
  request_id?: string;
}

export interface InviteCollaboratorResponse {
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: "super_admin" | "member";
    is_active: boolean;
  };
  temporary_password: string;
  must_change_password: boolean;
  email_delivery: EmailDeliveryResult;
}

export interface UpdateCollaboratorResponse {
  message: string;
  user: Pick<Collaborator, "id" | "email" | "role" | "is_active">;
  temporary_password?: string;
  must_change_password?: boolean;
  email_delivery?: EmailDeliveryResult;
}

// =====================================================
// LIST
// =====================================================
export async function listCollaborators(): Promise<Collaborator[]> {
  const { data } = await api.get<Collaborator[]>("/collaborators/");
  return data;
}

// =====================================================
// INVITE
// =====================================================
export async function inviteCollaborator(
  payload: InvitePayload,
): Promise<InviteCollaboratorResponse> {
  try {
    const { data } = await api.post<InviteCollaboratorResponse>(
      "/collaborators/",
      payload,
      { timeout: 60_000 }, // email sending bisa lama (GAS retry)
    );
    return data;
  } catch (err: unknown) {
    // ⭐ Re-throw sebagai ApiError dengan pesan yang jelas
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(0, "Gagal mengundang collaborator");
  }
}

// =====================================================
// UPDATE
// =====================================================
export async function updateCollaborator(
  userId: string,
  payload: {
    role?: "super_admin" | "member";
    is_active?: boolean;
    reset_password?: boolean;
  },
): Promise<UpdateCollaboratorResponse> {
  const { data } = await api.patch<UpdateCollaboratorResponse>(
    `/collaborators/${userId}`,
    payload,
    { timeout: 60_000 },
  );
  return data;
}

// =====================================================
// REMOVE
// =====================================================
export async function removeCollaborator(
  userId: string,
): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(
    `/collaborators/${userId}`,
  );
  return data;
}
// src/lib/api/collaborators.ts — TAMBAHKAN di paling bawah

// =====================================================
// ⭐ COLLABORATOR STATS — hanya owner/super_admin
// =====================================================
export interface CollaboratorStats {
  user_id: string;
  username: string;
  email: string;
  role: "owner" | "super_admin" | "member";
  is_active: boolean;
  must_change_password: boolean;
  avatar_url: string | null;

  total_uploads: number;
  total_uploads_size: number;
  last_upload_at: string | null;

  total_edits: number;
  total_edited_files: number;
  last_edit_at: string | null;

  total_downloads: number;
  total_previews: number;
  total_shares: number;
  total_conversions: number;
  total_activities: number;
  last_login_at: string | null;

  contributed_size: number;
}

export interface CollaboratorUpload {
  id: string;
  name: string;
  size: number;
  mime_type: string | null;
  category: string | null;
  file_type: string | null;
  created_at: string;
  drive_email: string | null;
}

export interface CollaboratorEdit {
  file_id: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  edit_count: number;
  last_edited_at: string;
  last_version_number: number | null;
}

export interface WorkspaceStatsSummary {
  total_users: number;
  total_uploads_workspace: number;
  total_uploads_size_workspace: number;
  total_edits_workspace: number;
  total_downloads_workspace: number;
  total_previews_workspace: number;
  total_shares_workspace: number;
  total_conversions_workspace: number;
}

export async function getCollaboratorStats(): Promise<CollaboratorStats[]> {
  const { data } = await api.get<CollaboratorStats[]>("/collaborators/stats");
  return data;
}

export async function getWorkspaceStatsSummary(): Promise<WorkspaceStatsSummary> {
  const { data } = await api.get<WorkspaceStatsSummary>(
    "/collaborators/stats/summary",
  );
  return data;
}

export async function listCollaboratorUploads(
  userId: string,
  limit = 50,
): Promise<CollaboratorUpload[]> {
  const { data } = await api.get<CollaboratorUpload[]>(
    `/collaborators/${userId}/uploads`,
    { params: { limit } },
  );
  return data;
}

export async function listCollaboratorEdits(
  userId: string,
  limit = 50,
): Promise<CollaboratorEdit[]> {
  const { data } = await api.get<CollaboratorEdit[]>(
    `/collaborators/${userId}/edits`,
    { params: { limit } },
  );
  return data;
}
