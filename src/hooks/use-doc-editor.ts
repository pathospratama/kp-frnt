// src/hooks/use-doc-editor.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  openDoc,
  saveDoc,
  type DocOpenResponse,
  type DocSaveResponse,
} from "@/lib/api/docs";

// =====================================================
// TYPES
// =====================================================
interface SaveState {
  status: "idle" | "saving" | "saved" | "error" | "unsaved";
  lastSavedAt: Date | null;
  error: string | null;
}

interface LoadError {
  message: string;
  status: number;
  isAuthError: boolean;
  requestId?: string; // ⭐ TAMBAH — untuk tracing 500 error
}

// =====================================================
// HOOK
// =====================================================
export function useDocEditor(fileId: string | null) {
  const [doc, setDoc] = useState<DocOpenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoadError | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({
    status: "idle",
    lastSavedAt: null,
    error: null,
  });

  const contentHashRef = useRef<string | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const pendingHtmlRef = useRef<string | null>(null);

  // ---- Load ----
  const load = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await openDoc(fileId);
      setDoc(res);
      contentHashRef.current = res.content_hash;
    } catch (e: unknown) {
      const err = e as {
        detail?: string;
        status?: number;
        requestId?: string;
      };
      const status = err?.status || 0;
      const requestId = err?.requestId;

      let message = err?.detail || "Gagal membuka dokumen";
      let isAuthError = false;

      if (status === 401) {
        isAuthError = true;
        message =
          err?.detail ||
          "Google Drive yang menyimpan file ini sudah tidak valid. " +
            "Buka menu 'Google Drive' → hapus akun lama → connect ulang.";
      } else if (status === 403) {
        message = err?.detail || "Anda tidak memiliki akses ke file ini.";
      } else if (status === 429) {
        message = "Terlalu banyak permintaan. Coba lagi beberapa saat.";
      } else if (status >= 500) {
        const rid = requestId ? ` (Ref: ${requestId})` : "";
        message = "Server sedang bermasalah. Coba lagi beberapa saat." + rid;
      }

      setError({ message, status, isAuthError, requestId });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Save internal ----
  const doSave = useCallback(
    async (html: string, saveAsNew = false) => {
      if (!fileId) return null;
      setSaveState((s) => ({ ...s, status: "saving", error: null }));
      try {
        const res: DocSaveResponse = await saveDoc(
          fileId,
          html,
          contentHashRef.current,
          saveAsNew,
        );
        contentHashRef.current = res.file.content_hash;
        setSaveState({
          status: "saved",
          lastSavedAt: new Date(),
          error: null,
        });
        return res;
      } catch (e: unknown) {
        const err = e as {
          detail?: string;
          status?: number;
          requestId?: string;
        };
        const status = err?.status || 0;
        const requestId = err?.requestId;

        let msg = err?.detail || "Gagal simpan";
        if (status === 401) {
          msg =
            "Google Drive tidak valid. Reconnect dulu di menu Google Drive.";
        } else if (status === 400) {
          msg = err?.detail || "Dokumen sudah berubah. Muat ulang.";
        } else if (status === 429) {
          msg = "Terlalu banyak permintaan. Coba lagi beberapa saat.";
        } else if (status >= 500) {
          const rid = requestId ? ` (Ref: ${requestId})` : "";
          msg = "Server error. Coba lagi beberapa saat." + rid;
        }

        setSaveState({ status: "error", lastSavedAt: null, error: msg });
        toast.error(msg);
        return null;
      }
    },
    [fileId],
  );

  // ---- Debounced save ----
  const queueSave = useCallback(
    (html: string) => {
      pendingHtmlRef.current = html;
      setSaveState((s) => ({ ...s, status: "unsaved" }));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (pendingHtmlRef.current) {
          doSave(pendingHtmlRef.current);
          pendingHtmlRef.current = null;
        }
      }, 1500);
    },
    [doSave],
  );

  // ---- Manual save ----
  const saveNow = useCallback(
    async (html: string, saveAsNew = false) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return doSave(html, saveAsNew);
    },
    [doSave],
  );

  // ---- Cleanup: save pending changes sebelum unmount ----
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (fileId && pendingHtmlRef.current) {
        const html = pendingHtmlRef.current;
        pendingHtmlRef.current = null;
        // Fire-and-forget — tidak blocking unmount
        saveDoc(fileId, html, contentHashRef.current, false).catch((err) => {
          console.warn("[useDocEditor] Save on unmount failed:", err);
        });
      }
    };
  }, [fileId]);

  return {
    doc,
    loading,
    error,
    saveState,
    queueSave,
    saveNow,
    reload: load,
  };
}
