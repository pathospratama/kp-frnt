// src/hooks/useUpload.ts
"use client";

import { useCallback, useRef, useState } from "react";
import { uploadFile } from "@/services/uploadService";
import type {
  UploadPhase,
  UploadProgress,
  UploadResult,
} from "@/types/upload";

export interface UseUploadState {
  phase: UploadPhase;
  overallPercent: number;
  clientPercent: number;
  serverPercent: number;
  message: string;
  speedBps: number;
  etaSeconds: number | null;
  bytesUploaded: number;
  bytesTotal: number;
  elapsedSeconds: number;
  fileName: string | null;
  category: string | null;
  isUploading: boolean;
  isDone: boolean;
  isError: boolean;
  errorMessage: string | null;
  errorCode: string | null;
  retryable: boolean;
}

const INITIAL: UseUploadState = {
  phase: "IDLE",
  overallPercent: 0,
  clientPercent: 0,
  serverPercent: 0,
  message: "",
  speedBps: 0,
  etaSeconds: null,
  bytesUploaded: 0,
  bytesTotal: 0,
  elapsedSeconds: 0,
  fileName: null,
  category: null,
  isUploading: false,
  isDone: false,
  isError: false,
  errorMessage: null,
  errorCode: null,
  retryable: false,
};

export function useUpload(apiBaseUrl: string, authToken: string) {
  const [state, setState] = useState<UseUploadState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const lastFileRef = useRef<File | null>(null);
  const lastFolderRef = useRef<string | undefined>(undefined);

  const upload = useCallback(
    async (file: File, folderId?: string): Promise<UploadResult> => {
      lastFileRef.current = file;
      lastFolderRef.current = folderId;

      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        ...INITIAL,
        phase: "UPLOADING_TO_SERVER",
        message: "Memulai upload...",
        isUploading: true,
        bytesTotal: file.size,
        fileName: file.name,
      });

      const result = await uploadFile(file, {
        folderId,
        apiBaseUrl,
        authToken,
        signal: controller.signal,
        onProgress: (p: UploadProgress) => {
          setState((prev) => ({
            ...prev,
            phase: p.phase,
            overallPercent: p.overallPercent,
            clientPercent: p.clientPercent,
            serverPercent: p.serverPercent,
            message: p.message,
            speedBps: p.speedBps || 0,
            etaSeconds: p.etaSeconds ?? null,
            bytesUploaded: p.bytesUploaded || 0,
            bytesTotal: p.bytesTotal || file.size,
            elapsedSeconds: p.elapsedSeconds || 0,
            fileName: p.fileName || file.name,
            category: p.category || null,
            isUploading:
              p.phase !== "DONE" &&
              p.phase !== "FAILED" &&
              p.phase !== "CANCELLED",
            isDone: p.phase === "DONE",
            isError: p.phase === "FAILED",
          }));
        },
      });

      if (!result.success) {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          isError: true,
          isDone: false,
          errorMessage: result.errorMessage || "Upload gagal",
          errorCode: result.errorCode || "UNKNOWN",
          retryable: result.retryable ?? false,
        }));
      }

      abortRef.current = null;
      return result;
    },
    [apiBaseUrl, authToken]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const retry = useCallback(async () => {
    if (lastFileRef.current) {
      return upload(lastFileRef.current, lastFolderRef.current);
    }
    return null;
  }, [upload]);

  const reset = useCallback(() => {
    setState(INITIAL);
    abortRef.current = null;
    lastFileRef.current = null;
    lastFolderRef.current = undefined;
  }, []);

  return { state, upload, cancel, retry, reset };
}