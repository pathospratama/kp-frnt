// src/services/uploadQueue.ts
/**
 * Upload queue untuk multiple files dengan konkurensi terbatas.
 * Berguna kalau user drop banyak file sekaligus.
 */

import { uploadFile } from "./uploadService";
import type {
  UploadOptions,
  UploadProgress,
  UploadResult,
} from "@/types/upload";

export type QueueItemStatus =
  | "queued"
  | "uploading"
  | "done"
  | "failed"
  | "cancelled";

export interface QueueItem {
  id: string;
  file: File;
  status: QueueItemStatus;
  progress: UploadProgress | null;
  result: UploadResult | null;
  error: string | null;
  abortController: AbortController;
}

export interface UploadQueueOptions extends Omit<UploadOptions, "signal" | "onProgress"> {
  /** Max upload concurrent (default 2) */
  concurrency?: number;
  /** Callback per item progress */
  onItemProgress?: (itemId: string, progress: UploadProgress) => void;
  /** Callback per item complete */
  onItemComplete?: (itemId: string, result: UploadResult) => void;
  /** Callback seluruh queue selesai */
  onAllComplete?: (results: Map<string, UploadResult>) => void;
}

function makeId(): string {
  return `up_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export class UploadQueue {
  private items: Map<string, QueueItem> = new Map();
  private queue: string[] = [];
  private activeCount = 0;
  private concurrency: number;
  private opts: UploadQueueOptions;
  private results: Map<string, UploadResult> = new Map();
  private stopped = false;

  constructor(opts: UploadQueueOptions) {
    this.opts = opts;
    this.concurrency = Math.max(1, opts.concurrency ?? 2);
  }

  /**
   * Tambah file ke queue. Return itemId.
   */
  add(file: File): string {
    const id = makeId();
    const item: QueueItem = {
      id,
      file,
      status: "queued",
      progress: null,
      result: null,
      error: null,
      abortController: new AbortController(),
    };
    this.items.set(id, item);
    this.queue.push(id);
    this.pump();
    return id;
  }

  /**
   * Batalkan satu item (kalau sedang upload atau masih queued).
   */
  cancel(id: string): void {
    const item = this.items.get(id);
    if (!item) return;
    item.abortController.abort();
    if (item.status === "queued") {
      this.queue = this.queue.filter((q) => q !== id);
      item.status = "cancelled";
    }
  }

  /**
   * Batalkan semua.
   */
  cancelAll(): void {
    this.stopped = true;
    this.queue = [];
    for (const item of this.items.values()) {
      item.abortController.abort();
    }
  }

  /**
   * Ambil semua item (untuk render UI).
   */
  getItems(): QueueItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Hapus item yang sudah selesai.
   */
  clearCompleted(): void {
    for (const [id, item] of this.items.entries()) {
      if (
        item.status === "done" ||
        item.status === "failed" ||
        item.status === "cancelled"
      ) {
        this.items.delete(id);
        this.results.delete(id);
      }
    }
  }

  // =====================================================
  // INTERNAL
  // =====================================================
  private pump(): void {
    if (this.stopped) return;

    while (
      this.activeCount < this.concurrency &&
      this.queue.length > 0
    ) {
      const id = this.queue.shift()!;
      const item = this.items.get(id);
      if (!item || item.status !== "queued") continue;

      void this.processItem(item);
    }

    // Kalau queue kosong & tidak ada aktif → all complete
    if (this.queue.length === 0 && this.activeCount === 0) {
      this.opts.onAllComplete?.(this.results);
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    item.status = "uploading";
    this.activeCount++;

    try {
      const result = await uploadFile(item.file, {
        ...this.opts,
        signal: item.abortController.signal,
        onProgress: (p) => {
          item.progress = p;
          this.opts.onItemProgress?.(item.id, p);
        },
      });

      item.result = result;
      item.status = result.success ? "done" : "failed";
      item.error = result.success
        ? null
        : result.errorMessage || "Upload gagal";
      this.results.set(item.id, result);

      this.opts.onItemComplete?.(item.id, result);
    } catch (e: unknown) {
      const msg = (e as Error)?.message || "Upload gagal";
      item.status = "failed";
      item.error = msg;
      const result: UploadResult = {
        success: false,
        errorMessage: msg,
        errorCode: "CLIENT_ERROR",
        retryable: true,
      };
      item.result = result;
      this.results.set(item.id, result);
      this.opts.onItemComplete?.(item.id, result);
    } finally {
      this.activeCount--;
      this.pump();
    }
  }
}