// src/components/UploadProgress.tsx
"use client";

import React from "react";
import { useUpload } from "@/hooks/useUpload";
import {
  formatBytes,
  formatEta,
  formatSpeed,
  truncateName,
} from "@/lib/format";
import type { UploadPhase } from "@/types/upload";

interface Props {
  apiBaseUrl: string;
  authToken: string;
  folderId?: string;
  onUploaded?: (result: {
    fileMeta?: Record<string, unknown>;
    driveEmail?: string;
    folderName?: string;
  }) => void;
  className?: string;
}

const PHASE_LABEL: Record<UploadPhase, string> = {
  IDLE: "Siap upload",
  UPLOADING_TO_SERVER: "Mengunggah ke server",
  RECEIVED: "Diterima server",
  CLASSIFYING: "Klasifikasi file",
  SELECTING_DRIVE: "Memilih Google Drive",
  CREATING_FOLDER: "Menyiapkan folder bulanan",
  UPLOADING_DRIVE: "Upload ke Google Drive",
  SAVING_METADATA: "Menyimpan metadata",
  DONE: "Selesai",
  FAILED: "Gagal",
  CANCELLED: "Dibatalkan",
};

export function UploadProgressPanel({
  apiBaseUrl,
  authToken,
  folderId,
  onUploaded,
  className = "",
}: Props) {
  const { state, upload, cancel, retry, reset } = useUpload(
    apiBaseUrl,
    authToken
  );
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await upload(file, folderId);

    if (result.success && onUploaded) {
      onUploaded({
        fileMeta: result.fileMeta,
        driveEmail: result.driveEmail,
        folderName: result.folderName,
      });
    }

    // Reset input supaya bisa upload file yang sama lagi
    if (inputRef.current) inputRef.current.value = "";
  };

  const barColor = state.isError
    ? "bg-red-500"
    : state.isDone
    ? "bg-emerald-500"
    : state.phase === "UPLOADING_DRIVE"
    ? "bg-blue-500"
    : "bg-indigo-500";

  return (
    <div
      className={`w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <h3 className="mb-3 text-sm font-semibold text-slate-800">
        Upload File
      </h3>

      {/* Input file */}
      <input
        ref={inputRef}
        type="file"
        onChange={handleFile}
        disabled={state.isUploading}
        className="mb-4 block w-full text-sm text-slate-600
                   file:mr-3 file:rounded-lg file:border-0
                   file:bg-indigo-50 file:px-4 file:py-2
                   file:text-sm file:font-medium file:text-indigo-700
                   hover:file:bg-indigo-100 disabled:opacity-50
                   disabled:cursor-not-allowed"
      />

      {state.phase !== "IDLE" && (
        <div className="space-y-3">
          {/* File name */}
          {state.fileName && (
            <div className="flex items-center justify-between gap-3">
              <span
                className="truncate text-xs font-medium text-slate-700"
                title={state.fileName}
              >
                {truncateName(state.fileName, 50)}
              </span>
              <span className="shrink-0 font-mono text-xs text-slate-500">
                {formatBytes(state.bytesTotal)}
              </span>
            </div>
          )}

          {/* Progress bar utama (overall) */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${state.overallPercent}%` }}
            />
            {state.isUploading && (
              <div
                className="absolute inset-y-0 left-0 animate-pulse rounded-full bg-white/30"
                style={{ width: `${state.overallPercent}%` }}
              />
            )}
          </div>

          {/* Label + persentase */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">
              {PHASE_LABEL[state.phase]}
            </span>
            <span className="font-mono font-semibold text-slate-600">
              {state.overallPercent.toFixed(0)}%
            </span>
          </div>

          {/* Detail dua fase */}
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="rounded-lg bg-slate-50 p-2">
              <div className="mb-1 font-medium text-slate-600">
                Transfer ke server
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${state.clientPercent}%` }}
                  />
                </div>
                <span className="font-mono text-slate-700">
                  {state.clientPercent.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <div className="mb-1 font-medium text-slate-600">
                Upload ke Drive
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${state.serverPercent}%` }}
                  />
                </div>
                <span className="font-mono text-slate-700">
                  {state.serverPercent.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Statistik: speed, ETA, bytes */}
          {state.isUploading && state.phase === "UPLOADING_DRIVE" && (
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-blue-50 p-2.5 text-[11px]">
              <div>
                <div className="text-slate-500">Kecepatan</div>
                <div className="font-mono font-semibold text-slate-800">
                  {formatSpeed(state.speedBps)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">ETA</div>
                <div className="font-mono font-semibold text-slate-800">
                  {formatEta(state.etaSeconds)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Terkirim</div>
                <div className="font-mono font-semibold text-slate-800">
                  {formatBytes(state.bytesUploaded)} /{" "}
                  {formatBytes(state.bytesTotal)}
                </div>
              </div>
            </div>
          )}

          {/* Elapsed time saat upload */}
          {state.isUploading && (
            <div className="text-[11px] text-slate-500">
              Berjalan: {Math.floor(state.elapsedSeconds)}s
            </div>
          )}

          {/* Pesan status */}
          <p
            className={`text-xs ${
              state.isError ? "text-red-600" : "text-slate-600"
            }`}
          >
            {state.message}
          </p>

          {/* Category badge saat done */}
          {state.isDone && state.category && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <span>📁</span>
              <span>{state.category}</span>
            </div>
          )}

          {/* Tombol aksi */}
          <div className="flex gap-2 pt-1">
            {state.isUploading && (
              <button
                type="button"
                onClick={cancel}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Batalkan
              </button>
            )}
            {state.isError && state.retryable && (
              <button
                type="button"
                onClick={retry}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Coba Lagi
              </button>
            )}
            {(state.isDone || state.isError) && (
              <button
                type="button"
                onClick={reset}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}