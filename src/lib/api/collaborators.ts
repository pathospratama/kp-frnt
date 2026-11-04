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
