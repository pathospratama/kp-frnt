// src/types/upload.ts
/**
 * Type definitions untuk sistem upload two-phase.
 */

// =====================================================
// PHASE ENUM
// =====================================================
export type UploadPhase =
  | "IDLE"
  | "UPLOADING_TO_SERVER"
  | "RECEIVED"
  | "CLASSIFYING"
  | "SELECTING_DRIVE"
  | "CREATING_FOLDER"
  | "UPLOADING_DRIVE"
  | "SAVING_METADATA"
  | "DONE"
  | "FAILED"
  | "CANCELLED";

// =====================================================
// PROGRESS STATE
// =====================================================
export interface UploadProgress {
  /** Fase saat ini */
  phase: UploadPhase;
  /** 0-100 overall (gabungan fase 1 + fase 2) */
  overallPercent: number;
  /** 0-100 progress transfer bytes ke server */
  clientPercent: number;
  /** 0-100 progress upload Drive */
  serverPercent: number;
  /** Pesan human-readable */
  message: string;
  /** Kecepatan upload (B/s), hanya valid saat UPLOADING_DRIVE */
  speedBps?: number;
  /** Estimasi sisa waktu (detik) */
  etaSeconds?: number;
  /** Bytes sudah terkirim ke Drive */
  bytesUploaded?: number;
  /** Total bytes file */
  bytesTotal?: number;
  /** Elapsed sejak mulai (detik) */
  elapsedSeconds?: number;
  /** File name */
  fileName?: string;
  /** Category hasil klasifikasi */
  category?: string;
}

// =====================================================
// RESULT
// =====================================================
export interface UploadResult {
  success: boolean;
  fileMeta?: Record<string, unknown>;
  driveEmail?: string;
  folderName?: string;
  errorCode?: string;
  errorMessage?: string;
  retryable?: boolean;
  /** Job ID — berguna untuk logging/analytics */
  jobId?: string;
}

// =====================================================
// OPTIONS
// =====================================================
export interface UploadOptions {
  folderId?: string;
  onProgress?: (p: UploadProgress) => void;
  signal?: AbortSignal;
  apiBaseUrl: string;
  authToken: string;
  /** Bobot fase 1 vs fase 2 (default 40/60) */
  clientWeight?: number;
  serverWeight?: number;
  /** Polling interval (default dari server) */
  pollIntervalMs?: number;
  /** Max retry untuk polling error transient */
  maxPollRetries?: number;
}

// =====================================================
// SERVER RESPONSES (internal)
// =====================================================
export interface UploadInitResponse {
  job_id: string;
  upload_token: string;
  phase: string;
  message: string;
  poll_url: string;
  poll_interval_seconds: number;
  estimated_drive_seconds: number;
}

export interface UploadStatusResponse {
  job_id: string;
  phase: UploadPhase;
  progress_percent: number;
  message: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  category?: string;
  bytes_uploaded: number;
  bytes_total: number;
  upload_speed_bps: number;
  eta_seconds?: number;
  started_at?: string;
  updated_at?: string;
  elapsed_seconds: number;
  file_meta?: Record<string, unknown>;
  drive_email?: string;
  folder_name?: string;
  error_code?: string;
  error_message?: string;
  retryable?: boolean;
}