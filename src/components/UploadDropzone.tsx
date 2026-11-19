// src/components/UploadDropzone.tsx
"use client";

import React, { useCallback, useState } from "react";
import { UploadProgressPanel } from "./UploadProgress";

interface Props {
  apiBaseUrl: string;
  authToken: string;
  folderId?: string;
  onUploaded?: (result: {
    fileMeta?: Record<string, unknown>;
    driveEmail?: string;
    folderName?: string;
  }) => void;
}

export function UploadDropzone({
  apiBaseUrl,
  authToken,
  folderId,
  onUploaded,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  return (
    <div className="w-full max-w-xl space-y-3">
      {!selectedFile && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
          }`}
        >
          <div className="mb-3 text-4xl">📁</div>
          <p className="mb-1 text-sm font-medium text-slate-700">
            Drag & drop file di sini
          </p>
          <p className="text-xs text-slate-500">atau klik tombol di bawah</p>
          <label className="mt-4 cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Pilih File
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setSelectedFile(f);
              }}
            />
          </label>
        </div>
      )}

      {selectedFile && (
        <UploadProgressPanel
          apiBaseUrl={apiBaseUrl}
          authToken={authToken}
          folderId={folderId}
          onUploaded={onUploaded}
        />
      )}
    </div>
  );
}