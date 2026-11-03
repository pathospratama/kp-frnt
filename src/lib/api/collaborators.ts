// src/lib/api/collaborators.ts
import { api } from "./client";
import type { Collaborator } from "@/lib/yudit/types";

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

export async function listCollaborators(): Promise<Collaborator[]> {
  const { data } = await api.get<Collaborator[]>("/collaborators/");
  return data;
}

export async function inviteCollaborator(
  payload: InvitePayload,
): Promise<InviteCollaboratorResponse> {
  const { data } = await api.post<InviteCollaboratorResponse>("/collaborators/", payload);
  return data;
}

export async function updateCollaborator(
  userId: string,
  payload: {
    role?: "super_admin" | "member";
    is_active?: boolean;
    reset_password?: boolean;
  },
): Promise<UpdateCollaboratorResponse> {
  const { data } = await api.patch<UpdateCollaboratorResponse>(`/collaborators/${userId}`, payload);
  return data;
}

export async function removeCollaborator(userId: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/collaborators/${userId}`);
  return data;
}
