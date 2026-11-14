// src/lib/api/transfer.ts
import { api } from "./client";

export type TransferStatus =
  | "pending"
  | "verified"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export interface Transfer {
  id: string;
  from_owner_id: string;
  to_owner_id: string;
  status: TransferStatus;
  reason: string | null;
  code_expires_at: string;
  code_attempts: number;
  max_attempts: number;
  created_at: string;
  verified_at: string | null;
  completed_at: string | null;
  expires_at: string;
  error_message: string | null;
  from_owner_email?: string;
  from_owner_username?: string;
  to_owner_email?: string;
  to_owner_username?: string;
  snapshot_before?: Record<string, unknown>;
  snapshot_after?: Record<string, unknown>;
  execution_log?: Array<Record<string, unknown>>;
}

export async function requestTransfer(payload: {
  target_email: string;
  reason?: string;
}): Promise<{
  transfer_id: string;
  status: TransferStatus;
  code_expires_at: string;
  expires_at: string;
  message: string;
  workspace_summary: Record<string, number>;
}> {
  const { data } = await api.post("/transfer/request", payload);
  return data;
}

export async function verifyTransfer(payload: {
  transfer_id: string;
  code: string;
}): Promise<{
  transfer_id: string;
  status: TransferStatus;
  message: string;
}> {
  const { data } = await api.post("/transfer/verify", payload);
  return data;
}

export async function executeTransfer(transferId: string): Promise<{
  transfer_id: string;
  status: TransferStatus;
  message: string;
  snapshot_after: Record<string, unknown>;
  execution_log: Array<Record<string, unknown>>;
}> {
  const { data } = await api.post("/transfer/execute", {
    transfer_id: transferId,
  });
  return data;
}

export async function cancelTransfer(payload: {
  transfer_id: string;
  reason?: string;
}): Promise<{ transfer_id: string; status: TransferStatus }> {
  const { data } = await api.post("/transfer/cancel", payload);
  return data;
}

export async function listTransfers(): Promise<Transfer[]> {
  const { data } = await api.get("/transfer/");
  return data;
}

export async function getTransferDetail(id: string): Promise<Transfer> {
  const { data } = await api.get(`/transfer/${id}`);
  return data;
}
