// src/lib/api/assignments.ts
import { api } from "./client";
import type { DocumentAssignment } from "@/lib/yudit/types";

export async function assignDocument(payload: {
  file_id: string;
  assigned_to: string;
  can_edit?: boolean;
  can_delete?: boolean;
  can_share?: boolean;
  note?: string;
  expires_at?: string;
}) {
  const { data } = await api.post("/assignments/", payload);
  return data;
}

export async function listFileAssignments(fileId: string): Promise<DocumentAssignment[]> {
  const { data } = await api.get<DocumentAssignment[]>(`/assignments/file/${fileId}`);
  return data;
}

export async function listUserAssignments(userId: string): Promise<DocumentAssignment[]> {
  const { data } = await api.get<DocumentAssignment[]>(`/assignments/user/${userId}`);
  return data;
}

export async function revokeAssignment(assignmentId: string) {
  const { data } = await api.delete(`/assignments/${assignmentId}`);
  return data;
}

export async function myAssignments(): Promise<DocumentAssignment[]> {
  const { data } = await api.get<DocumentAssignment[]>("/assignments/my");
  return data;
}