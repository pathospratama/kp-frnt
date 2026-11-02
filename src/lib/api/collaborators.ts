// src/lib/api/collaborators.ts
import { api } from "./client";
import type { Collaborator } from "@/lib/yudit/types";

export interface InvitePayload {
  email: string;
  username?: string;
  role: "super_admin" | "member";
}

export async function listCollaborators(): Promise<Collaborator[]> {
  const { data } = await api.get<Collaborator[]>("/collaborators/");
  return data;
}

export async function inviteCollaborator(
  payload: InvitePayload,
): Promise<{ user: Collaborator; temporary_password: string }> {
  const { data } = await api.post("/collaborators/", payload);
  return data;
}

export async function updateCollaborator(
  userId: string,
  payload: {
    role?: "super_admin" | "member";
    is_active?: boolean;
    reset_password?: boolean;
  },
) {
  const { data } = await api.patch(`/collaborators/${userId}`, payload);
  return data;
}

export async function removeCollaborator(userId: string) {
  const { data } = await api.delete(`/collaborators/${userId}`);
  return data;
}