// src/services/uploadService.ts
/**
 * Upload service — two-phase upload dengan progress tracking akurat.
 *
 * Fase 1 (bytes → server): diukur via XHR onUploadProgress (0-100%)
 * Fase 2 (server → Drive): diukur via polling /status (0-100%)
 *
 * Overall progress = clientProgress × clientWeight + serverProgress × serverWeight
 */

import type {
  UploadInitResponse,
  UploadOptions,
  UploadPhase,
  UploadProgress,
  UploadResult,
  UploadStatusResponse,
} from "@/types/upload";

// =====================================================
// MAIN UPLOAD
// =====================================================
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const {
    folderId,
    onProgress,
    signal,
    apiBaseUrl,
    authToken,
    clientWeight = 0.4,
    serverWeight = 0.6,
    pollIntervalMs,
    maxPollRetries = 5,
  } = options;

  const startedAt = Date.now();

  const emit = (p: UploadProgress) => {
    try {
      onProgress?.(p);
    } catch (e) {
      console.error("[upload] onProgress error", e);
    }
  };

  // ---------------------------------------------------
  // FASE 1: POST /files/upload/init
  // ---------------------------------------------------
  emit({
    phase: "UPLOADING_TO_SERVER",
    overallPercent: 0,
    clientPercent: 0,
    serverPercent: 0,
    message: "Mengunggah file ke server...",
    fileName: file.name,
    bytesUploaded: 0,
    bytesTotal: file.size,
    elapsedSeconds: 0,
  });

  let initResponse: UploadInitResponse;
  try {
    initResponse = await uploadBytesToServer({
      file,
      folderId,
      apiBaseUrl,
      authToken,
      signal,
      onUploadProgress: (clientPct, loaded, total) => {
        emit({
          phase: "UPLOADING_TO_SERVER",
          overallPercent: clientPct * clientWeight,
          clientPercent: clientPct,
          serverPercent: 0,
          message: `Mengunggah ke server... ${clientPct.toFixed(0)}%`,
          fileName: file.name,
          bytesUploaded: loaded,
          bytesTotal: total,
          elapsedSeconds: (Date.now() - startedAt) / 1000,
        });
      },
    });
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };

    if (err?.name === "AbortError") {
      emit({
        phase: "CANCELLED",
        overallPercent: 0,
        clientPercent: 0,
        serverPercent: 0,
        message: "Upload dibatalkan.",
        fileName: file.name,
      });
      return { success: false, errorCode: "CANCELLED" };
    }

    const msg = err?.message || "Gagal upload ke server";
    emit({
      phase: "FAILED",
      overallPercent: 0,
      clientPercent: 0,
      serverPercent: 0,
      message: msg,
      fileName: file.name,
    });
    return {
      success: false,
      errorCode: "CLIENT_UPLOAD_FAILED",
      errorMessage: msg,
      retryable: true,
    };
  }

  // Fase 1 selesai — overall = 100 × clientWeight (default 40%)
  emit({
    phase: "RECEIVED",
    overallPercent: 100 * clientWeight,
    clientPercent: 100,
    serverPercent: 0,
    message: initResponse.message || "File diterima server.",
    fileName: file.name,
    bytesUploaded: file.size,
    bytesTotal: file.size,
    elapsedSeconds: (Date.now() - startedAt) / 1000,
  });

  // ---------------------------------------------------
  // FASE 2: Polling GET /files/upload/{job_id}/status
  // ---------------------------------------------------
  const jobId = initResponse.job_id;
  const interval = Math.max(
    200,
    pollIntervalMs ?? (initResponse.poll_interval_seconds || 0.5) * 1000
  );

  let consecutiveErrors = 0;

  while (true) {
    if (signal?.aborted) {
      emit({
        phase: "CANCELLED",
        overallPercent: 0,
        clientPercent: 100,
        serverPercent: 0,
        message: "Upload dibatalkan.",
        fileName: file.name,
      });
      // Cleanup job di server
      void cleanupJob(jobId, apiBaseUrl, authToken);
      return { success: false, errorCode: "CANCELLED", jobId };
    }

    await sleep(interval);

    let status: UploadStatusResponse;
    try {
      status = await fetchStatus(jobId, apiBaseUrl, authToken, signal);
      consecutiveErrors = 0;
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name === "AbortError") {
        void cleanupJob(jobId, apiBaseUrl, authToken);
        return { success: false, errorCode: "CANCELLED", jobId };
      }

      consecutiveErrors++;
      if (consecutiveErrors >= maxPollRetries) {
        emit({
          phase: "FAILED",
          overallPercent: 0,
          clientPercent: 100,
          serverPercent: 0,
          message: "Koneksi ke server terputus saat polling status.",
          fileName: file.name,
        });
        void cleanupJob(jobId, apiBaseUrl, authToken);
        return {
          success: false,
          errorCode: "NETWORK_ERROR",
          errorMessage: "Koneksi ke server terputus.",
          retryable: true,
          jobId,
        };
      }
      continue;
    }

    // Hitung overall percent
    const serverPct = status.progress_percent || 0;
    const overall = 100 * clientWeight + serverPct * serverWeight;

    emit({
      phase: status.phase,
      overallPercent: Math.min(100, overall),
      clientPercent: 100,
      serverPercent: serverPct,
      message: status.message || phaseMessage(status.phase),
      speedBps: status.upload_speed_bps,
      etaSeconds: status.eta_seconds,
      bytesUploaded: status.bytes_uploaded,
      bytesTotal: status.bytes_total || file.size,
      elapsedSeconds: status.elapsed_seconds,
      fileName: status.file_name || file.name,
      category: status.category,
    });

    // Terminal states
    if (status.phase === "DONE") {
      // Konfirmasi & cleanup job di server (hemat RAM)
      void cleanupJob(jobId, apiBaseUrl, authToken);

      emit({
        phase: "DONE",
        overallPercent: 100,
        clientPercent: 100,
        serverPercent: 100,
        message: "Upload selesai!",
        fileName: status.file_name || file.name,
        bytesUploaded: file.size,
        bytesTotal: file.size,
        elapsedSeconds: (Date.now() - startedAt) / 1000,
      });

      return {
        success: true,
        fileMeta: status.file_meta,
        driveEmail: status.drive_email,
        folderName: status.folder_name,
        jobId,
      };
    }

    if (status.phase === "FAILED") {
      emit({
        phase: "FAILED",
        overallPercent: overall,
        clientPercent: 100,
        serverPercent: serverPct,
        message: status.error_message || "Upload gagal.",
        fileName: file.name,
        elapsedSeconds: status.elapsed_seconds,
      });

      void cleanupJob(jobId, apiBaseUrl, authToken);

      return {
        success: false,
        errorCode: status.error_code,
        errorMessage: status.error_message,
        retryable: status.retryable,
        jobId,
      };
    }
  }
}

// =====================================================
// PHASE MESSAGES
// =====================================================
function phaseMessage(phase: UploadPhase): string {
  switch (phase) {
    case "RECEIVED":
      return "File diterima server.";
    case "CLASSIFYING":
      return "Mengklasifikasi file...";
    case "SELECTING_DRIVE":
      return "Memilih Google Drive...";
    case "CREATING_FOLDER":
      return "Menyiapkan folder bulanan...";
    case "UPLOADING_DRIVE":
      return "Mengunggah ke Google Drive...";
    case "SAVING_METADATA":
      return "Menyimpan metadata...";
    default:
      return phase;
  }
}

// =====================================================
// XHR UPLOAD (bytes → server)
// =====================================================
function uploadBytesToServer(params: {
  file: File;
  folderId?: string;
  apiBaseUrl: string;
  authToken: string;
  signal?: AbortSignal;
  onUploadProgress: (pct: number, loaded: number, total: number) => void;
}): Promise<UploadInitResponse> {
  const { file, folderId, apiBaseUrl, authToken, signal, onUploadProgress } =
    params;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiBaseUrl}/files/upload/init`);

    xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = (e.loaded / e.total) * 100;
        onUploadProgress(pct, e.loaded, e.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadInitResponse;
          resolve(data);
        } catch {
          reject(new Error("Invalid JSON response dari server"));
        }
      } else {
        let detail = `Server error ${xhr.status}`;
        try {
          const data = JSON.parse(xhr.responseText);
          detail = data.detail || data.message || detail;
        } catch {
          // ignore
        }
        reject(new Error(detail));
      }
    };

    xhr.onerror = () => reject(new Error("Network error saat upload"));
    xhr.ontimeout = () => reject(new Error("Upload timeout"));

    if (signal) {
      if (signal.aborted) {
        const err = new Error("Aborted");
        err.name = "AbortError";
        reject(err);
        return;
      }
      signal.addEventListener("abort", () => {
        xhr.abort();
        const err = new Error("Aborted");
        err.name = "AbortError";
        reject(err);
      });
    }

    const formData = new FormData();
    formData.append("file", file);
    if (folderId) formData.append("folder_id", folderId);

    xhr.send(formData);
  });
}

// =====================================================
// FETCH STATUS (polling)
// =====================================================
async function fetchStatus(
  jobId: string,
  apiBaseUrl: string,
  authToken: string,
  signal?: AbortSignal
): Promise<UploadStatusResponse> {
  const res = await fetch(
    `${apiBaseUrl}/files/upload/${jobId}/status`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  if (!res.ok) {
    throw new Error(`Status ${res.status}`);
  }
  return res.json();
}

// =====================================================
// CLEANUP JOB (fire-and-forget)
// =====================================================
async function cleanupJob(
  jobId: string,
  apiBaseUrl: string,
  authToken: string
): Promise<void> {
  try {
    await fetch(`${apiBaseUrl}/files/upload/${jobId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
  } catch {
    // Ignore — cleanup opsional
  }
}

// =====================================================
// SLEEP
// =====================================================
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}