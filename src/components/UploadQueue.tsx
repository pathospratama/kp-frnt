// src/components/UploadQueue.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { UploadQueue, type QueueItem } from "@/services/uploadQueue";
import { formatBytes, formatEta, formatSpeed, truncateName } from "@/lib/format";

interface Props {
  apiBaseUrl: string;
  authToken: string;
  folderId?: string;
  concurrency?: number;
  onAllComplete?: (results: Map<string, unknown>) => void;
}

const STATUS_LABEL: Record<string, string> = {
  queued: "Menunggu",
  uploading: "Upload",
  done: "Selesai",
  failed: "Gagal",
  cancelled: "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  queued: "text-slate-500",
  uploading: "text-blue-600",
  done: "text-emerald-600",
  failed: "text-red-600",
  cancelled: "text-slate-400",
};

export function UploadQueuePanel({
  apiBaseUrl,
  authToken,
  folderId,
  concurrency = 2,
  onAllComplete,
}: Props) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const queueRef = useRef<UploadQueue | null>(null);

  useEffect(() => {
    queueRef.current = new UploadQueue({
      apiBaseUrl,
      authToken,
      folderId,
      concurrency,
      onItemProgress: () => {
        // Force re-render
        if (queueRef.current) {
          setItems([...queueRef.current.getItems()]);
        }
      },
      onItemComplete: () => {
        if (queueRef.current) {
          setItems([...queueRef.current.getItems()]);
        }
      },
      onAllComplete: (results) => {
        onAllComplete?.(results as Map<string, unknown>);
      },
    });
    return () => {
      queueRef.current?.cancelAll();
    };
  }, [apiBaseUrl, authToken, folderId, concurrency, onAllComplete]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !queueRef.current) return;
    for (let i = 0; i < files.length; i++) {
      queueRef.current.add(files[i]);
    }
    setItems([...queueRef.current.getItems()]);
    e.target.value = "";
  };

  const activeCount = items.filter((i) => i.status === "uploading").length;
  const queuedCount = items.filter((i) => i.status === "queued").length;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className="w-full max-w-2xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">
          Upload Queue
        </h3>
        {items.length > 0 && (
          <div className="text-xs text-slate-500">
            {doneCount}/{items.length} selesai
            {activeCount > 0 && ` · ${activeCount} aktif`}
            {queuedCount > 0 && ` · ${queuedCount} antri`}
          </div>
        )}
      </div>

      <input
        type="file"
        multiple
        onChange={handleFiles}
        className="block w-full text-sm text-slate-600
                   file:mr-3 file:rounded-lg file:border-0
                   file:bg-indigo-50 file:px-4 file:py-2
                   file:text-sm file:font-medium file:text-indigo-700
                   hover:file:bg-indigo-100"
      />

      <div className="space-y-2">
        {items.map((item) => {
          const p = item.progress;
          const pct = p?.overallPercent ?? 0;
          const barColor =
            item.status === "done"
              ? "bg-emerald-500"
              : item.status === "failed"
              ? "bg-red-500"
              : item.status === "cancelled"
              ? "bg-slate-400"
              : "bg-indigo-500";

          return (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-xs font-medium text-slate-800"
                    title={item.file.name}
                  >
                    {truncateName(item.file.name, 50)}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                    <span className={STATUS_COLOR[item.status]}>
                      {STATUS_LABEL[item.status]}
                    </span>
                    <span className="text-slate-400">
                      {formatBytes(item.file.size)}
                    </span>
                    {p?.speedBps ? (
                      <span className="text-slate-500">
                        · {formatSpeed(p.speedBps)}
                      </span>
                    ) : null}
                    {p?.etaSeconds ? (
                      <span className="text-slate-500">
                        · ETA {formatEta(p.etaSeconds)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs font-medium text-slate-600">
                    {pct.toFixed(0)}%
                  </span>
                  {item.status === "uploading" && (
                    <button
                      type="button"
                      onClick={() => queueRef.current?.cancel(item.id)}
                      className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {item.error && (
                <p className="mt-1.5 text-[11px] text-red-600">
                  {item.error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {items.length > 0 && doneCount === items.length && (
        <button
          type="button"
          onClick={() => {
            queueRef.current?.clearCompleted();
            setItems([]);
          }}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          Bersihkan
        </button>
      )}
    </div>
  );
}