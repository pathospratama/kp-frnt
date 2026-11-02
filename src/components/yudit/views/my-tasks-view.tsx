// src/components/yudit/views/my-tasks-view.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  FileText,
  Calendar,
  Lock,
  Edit3,
  Loader2,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useYudit } from "@/lib/yudit/store";
import { myAssignments } from "@/lib/api/assignments";
import type { DocumentAssignment } from "@/lib/yudit/types";
import { formatBytes, formatDate } from "@/lib/yudit/utils";
import { FileIcon } from "../ui/file-icon";
import { cn } from "@/lib/utils";

export function MyTasksView() {
  const user = useYudit((s) => s.user);
  const openEditor = useYudit((s) => s.openEditor);

  const [assignments, setAssignments] = useState<DocumentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await myAssignments();
      setAssignments(res);
    } catch (e: any) {
      toast.error(e?.detail || "Gagal memuat tugas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isExpired = (a: DocumentAssignment) => {
    if (!a.expires_at) return false;
    return new Date(a.expires_at) < new Date();
  };

  // =====================================================
  // DEFENSIVE GUARD — hanya member yang boleh lihat view ini
  // =====================================================
  if (!user || user.role !== "member") {
    return (
      <div className="grid place-items-center py-20">
        <div className="max-w-sm rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(239,68,68,0.15)]">
            <AlertCircle size={28} className="text-[var(--y-danger)]" />
          </div>
          <h3 className="mb-2 text-base font-semibold text-[var(--y-text)]">
            Halaman Khusus Member
          </h3>
          <p className="text-sm text-[var(--y-text-dim)]">
            Halaman ini hanya untuk collaborator (member). Anda login sebagai{" "}
            <b className="text-[var(--y-text)]">{user?.role}</b>.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="y-anim-fade">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--y-text)]">
          Dokumen Saya
        </h1>
        <p className="text-[13px] text-[var(--y-text-dim)]">
          Dokumen yang di-assign oleh owner — hanya ini yang bisa Anda edit
        </p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 size={28} className="animate-spin text-[var(--y-primary)]" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--y-border)] py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--y-bg-elev)]">
            <Inbox size={28} className="text-[var(--y-text-mute)]" />
          </div>
          <div className="mt-3 text-sm font-semibold text-[var(--y-text-dim)]">
            Belum ada dokumen di-assign
          </div>
          <div className="mt-1 text-xs text-[var(--y-text-mute)]">
            Owner akan meng-assign dokumen yang perlu Anda kerjakan
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {assignments.map((a, i) => {
            const expired = isExpired(a);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "rounded-2xl border bg-[var(--y-bg-elev)] p-4 transition-all",
                  expired
                    ? "border-[rgba(239,68,68,0.3)] opacity-60"
                    : "border-[var(--y-border)] hover:border-[rgba(99,102,241,0.4)]",
                )}
              >
                <div className="flex items-start gap-3">
                  <FileIcon
                    mime={a.file?.mime_type || ""}
                    name={a.file?.name || ""}
                    size={20}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[var(--y-text)]">
                      {a.file?.name || "Unknown"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--y-text-mute)]">
                      <span className="inline-flex items-center gap-1">
                        <FileText size={10} />
                        {formatBytes(a.file?.size || 0)}
                      </span>
                      {a.file?.created_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(a.file.created_at)}
                        </span>
                      )}
                      {a.expires_at && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1",
                            expired && "text-[var(--y-danger)]",
                          )}
                        >
                          <Lock size={10} />
                          {expired
                            ? "Expired"
                            : `s/d ${formatDate(a.expires_at)}`}
                        </span>
                      )}
                    </div>
                    {a.note && (
                      <div className="mt-2 rounded-lg bg-[var(--y-bg)] px-2.5 py-1.5 text-[11px] italic text-[var(--y-text-dim)]">
                        💬 {a.note}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--y-border-soft)] pt-3">
                  <div className="flex items-center gap-1.5">
                    {a.can_edit && (
                      <PermissionChip label="Edit" color="#10b981" />
                    )}
                    {a.can_delete && (
                      <PermissionChip label="Hapus" color="#ef4444" />
                    )}
                    {a.can_share && (
                      <PermissionChip label="Share" color="#22d3ee" />
                    )}
                  </div>
                  {a.can_edit && !expired && (
                    <button
                      onClick={() => {
                        if (!a.file) return;
                        openEditor(a.file.id, "local");
                      }}
                      className="y-gradient-brand inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold text-white"
                    >
                      <Edit3 size={12} />
                      Edit Dokumen
                    </button>
                  )}
                  {expired && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--y-danger)]">
                      <AlertCircle size={12} />
                      Akses kedaluwarsa
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PermissionChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
      style={{ background: `${color}22`, color }}
    >
      {label}
    </span>
  );
}