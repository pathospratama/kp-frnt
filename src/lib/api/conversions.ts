// src/lib/api/conversions.ts
import { api } from "./client";
import type {
  ConversionJob,
  ConversionOperation,
  ConversionOperationInfo,
  ConversionResult,
} from "@/lib/yudit/types";
import type { ApiFile } from "./files";

// =====================================================
// LIST OPERATIONS
// =====================================================
export interface UnsupportedOp {
  key: string;
  reason: string;
}

export async function listOperations(): Promise<{
  operations: ConversionOperationInfo[];
  unsupported: UnsupportedOp[];
}> {
  const { data } = await api.get<{
    operations: ConversionOperationInfo[];
    unsupported: UnsupportedOp[];
  }>("/conversions/operations");
  return data;
}
// =====================================================
// RUN CONVERSION
// =====================================================
export interface ConvertPayload {
  operation: ConversionOperation;
  file_ids: string[];
  params?: Record<string, unknown>;
}

export async function runConversion(
  payload: ConvertPayload,
): Promise<ConversionResult> {
  const { data } = await api.post<ConversionResult>("/conversions/", payload, {
    timeout: 300_000, // 5 menit — konversi bisa lama
  });
  return data;
}

// =====================================================
// JOBS HISTORY
// =====================================================
export async function listJobs(limit = 50): Promise<ConversionJob[]> {
  const { data } = await api.get<ConversionJob[]>("/conversions/jobs", {
    params: { limit },
  });
  return data;
}

// =====================================================
// LINEAGE (parent & children)
// =====================================================
export interface LineageResponse {
  file: ApiFile;
  parent: {
    id: string;
    name: string;
    size: number;
    mime_type: string | null;
    created_at: string;
  } | null;
  children: {
    id: string;
    name: string;
    size: number;
    mime_type: string | null;
    derived_from_operation: string | null;
    created_at: string;
  }[];
}

export async function getLineage(fileId: string): Promise<LineageResponse> {
  const { data } = await api.get<LineageResponse>(
    `/conversions/files/${fileId}/lineage`,
  );
  return data;
}