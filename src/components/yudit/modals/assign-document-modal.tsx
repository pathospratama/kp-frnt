// src/components/yudit/modals/assign-document-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  UserPlus, X, Loader2, Trash2, Users, ShieldCheck,
  Clock, CheckCircle2, Search, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  assignDocument, listFileAssignments, revokeAssignment,
} from "@/lib/api/assignments";
import { listCollaborators } from "@/lib/api/collaborators";
import type { Collaborator, DocumentAssignment } from "@/lib/yudit/types";
import { cn } from "@/lib/utils";

interface AssignDocumentModalProps {
  open: boolean;
  fileId: string;
  fileName: string;
  onClose: () => void;
}

export function AssignDocumentModal({
  open, fileId, fileName, onClose,
}: AssignDocumentModalProps) {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [assignments, setAssignments] = useState<DocumentAssignment[]>([]);
  const [selected, setSelected] = useState<Collaborator | null>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [note, setNote] = useState("");
  const [expiresHours, setExpiresHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // ---- Load data saat open ----
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cs, as] = await Promise.all([
          listCollaborators(),
          listFileAssignments(fileId),
        ]);
        if (!cancelled) {
          setCollabs(cs.filter((c) => c.is_active));
          setAssignments(as);
        }
      } catch (e: any) {
        toast.error(e?.detail || "Gagal memuat data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, fileId]);

  // Reset saat close
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setCanEdit(true);
      setCanDelete(false);
      setCanShare(false);
      setNote("");
      setExpiresHours("");
      setSearch("");
    }
  }, [open]);

  const handleAssign = async () => {
    if (!selected) {
      toast.error("Pilih collaborator dulu");
      return;
    }
    setSubmitting(true);
    try {
      const expiresAt = expiresHours
        ? new Date(
            Date.now() + parseInt(expiresHours) * 3600 * 1000,
          ).toISOString()
        : undefined;

      await assignDocument({
        file_id: fileId,
        assigned_to: selected.id,
        can_edit: canEdit,
        can_delete: canDelete,
        can_share: canShare,
        note: note.trim() || undefined,
        expires_at: expiresAt,
      });

      toast.success(`Di-assign ke ${selected.email}`);
      // Reload
      const updated = await listFileAssignments(fileId);
      setAssignments(updated);
      setSelected(null);
      setNote("");
    } catch (e: any) {
      toast.error(e?.detail || "Gagal assign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (assignmentId: string) => {
    try {
      await revokeAssignment(assignmentId);
      toast.success("Assignment dicabut");
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (e: any) {
      toast.error(e?.detail || "Gagal revoke");
    }
  };

  // ---- Derived ----
  const assignedIds = new Set(assignments.map((a) => a.assigned_to));
  const availableCollabs = collabs.filter((c) => !assignedIds.has(c.id));
  const filteredAvailable = availableCollabs.filter(
    (c) =>
      !search ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[998] grid place-items-center p-5"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            className="y-glass-strong y-glow-soft flex max-h-[88vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-[var(--y-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[var(--y-border)] p-5">
              <div className="y-gradient-brand y-glow-primary grid h-10 w-10 shrink-0 place-items-center rounded-xl">
                <UserPlus size={18} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-[var(--y-text)]">
                  Assign Dokumen
                </h3>
                <p className="truncate text-xs text-[var(--y-text-dim)]">
                  {fileName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-[var(--y-text-mute)] transition-colors hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="grid place-items-center py-12">
                  <Loader2 size={24} className="animate-spin text-[var(--y-primary)]" />
                </div>
              ) : (
                <>
                  {/* ===== Assignments yang sudah ada ===== */}
                  {assignments.length > 0 && (
                    <div className="mb-5">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
                        <CheckCircle2 size={12} />
                        Sudah di-assign ({assignments.length})
                      </div>
                      <div className="space-y-1.5">
                        {assignments.map((a) => (
                          <ExistingAssignment
                            key={a.id}
                            assignment={a}
                            onRevoke={() => handleRevoke(a.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ===== Pilih collaborator baru ===== */}
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
                    <UserPlus size={12} />
                    Assign ke Collaborator Baru
                  </div>

                  {availableCollabs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--y-border)] py-6 text-center text-xs text-[var(--y-text-mute)]">
                      {collabs.length === 0
                        ? "Belum ada collaborator. Undang dulu di menu Collaborators."
                        : "Semua collaborator sudah di-assign"}
                    </div>
                  ) : (
                    <>
                      {/* Search */}
                      {availableCollabs.length > 3 && (
                        <div className="relative mb-2">
                          <Search
                            size={14}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)]"
                          />
                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari collaborator…"
                            className="y-focus h-9 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] pl-9 pr-3 text-[13px] text-[var(--y-text)] outline-none"
                          />
                        </div>
                      )}

                      {/* List collaborator */}
                      <div className="mb-3 max-h-[180px] space-y-1 overflow-y-auto">
                        {filteredAvailable.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelected(c)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all",
                              selected?.id === c.id
                                ? "border-[var(--y-primary)] bg-[rgba(99,102,241,0.12)]"
                                : "border-[var(--y-border)] hover:border-[var(--y-primary)]",
                            )}
                          >
                            <div
                              className={cn(
                                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white",
                                c.role === "super_admin"
                                  ? "bg-[#f59e0b]"
                                  : "bg-[var(--y-primary)]",
                              )}
                            >
                              {c.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13px] font-semibold text-[var(--y-text)]">
                                {c.username}
                              </div>
                              <div className="truncate text-[11px] text-[var(--y-text-mute)]">
                                {c.email}
                              </div>
                            </div>
                            {c.role === "super_admin" && (
                              <ShieldCheck size={12} className="text-[#f59e0b]" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Permission config (kalau sudah pilih) */}
                      {selected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="overflow-hidden rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] p-3"
                        >
                          <div className="mb-2 text-[11px] font-semibold uppercase text-[var(--y-text-mute)]">
                            Permission untuk {selected.username}
                          </div>
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            <PermToggle
                              active={canEdit}
                              onClick={() => setCanEdit(!canEdit)}
                              label="Edit Dokumen"
                              color="#10b981"
                            />
                            <PermToggle
                              active={canDelete}
                              onClick={() => setCanDelete(!canDelete)}
                              label="Hapus"
                              color="#ef4444"
                            />
                            <PermToggle
                              active={canShare}
                              onClick={() => setCanShare(!canShare)}
                              label="Share"
                              color="#22d3ee"
                            />
                          </div>

                          <div className="mb-2 grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--y-text-mute)]">
                                Expiry (jam)
                              </label>
                              <input
                                type="number"
                                value={expiresHours}
                                onChange={(e) => setExpiresHours(e.target.value)}
                                placeholder="Tanpa expiry"
                                className="y-focus h-8 w-full rounded-md border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-2 text-[12px] text-[var(--y-text)] outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--y-text-mute)]">
                                Catatan
                              </label>
                              <input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Revisi bab 2…"
                                className="y-focus h-8 w-full rounded-md border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-2 text-[12px] text-[var(--y-text)] outline-none"
                              />
                            </div>
                          </div>

                          <button
                            onClick={handleAssign}
                            disabled={submitting}
                            className="y-gradient-brand inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-60"
                          >
                            {submitting ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <UserPlus size={14} />
                            )}
                            Assign Sekarang
                          </button>
                        </motion.div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =====================================================
// EXISTING ASSIGNMENT ROW
// =====================================================
function ExistingAssignment({
  assignment,
  onRevoke,
}: {
  assignment: DocumentAssignment;
  onRevoke: () => void;
}) {
  const user = assignment.assigned_to_user;
  const expired =
    assignment.expires_at &&
    new Date(assignment.expires_at) < new Date();

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2",
        expired
          ? "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)]"
          : "border-[var(--y-border)] bg-[var(--y-bg)]",
      )}
    >
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--y-primary)] text-[10px] font-bold text-white">
        {user?.username?.charAt(0).toUpperCase() || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-semibold text-[var(--y-text)]">
          {user?.username || "Unknown"}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {assignment.can_edit && (
            <span className="rounded bg-[rgba(16,185,129,0.15)] px-1.5 py-0.5 font-bold text-[#10b981]">
              EDIT
            </span>
          )}
          {assignment.can_delete && (
            <span className="rounded bg-[rgba(239,68,68,0.15)] px-1.5 py-0.5 font-bold text-[#ef4444]">
              DELETE
            </span>
          )}
          {assignment.can_share && (
            <span className="rounded bg-[rgba(34,211,238,0.15)] px-1.5 py-0.5 font-bold text-[#22d3ee]">
              SHARE
            </span>
          )}
          {expired && (
            <span className="inline-flex items-center gap-1 rounded bg-[rgba(239,68,68,0.15)] px-1.5 py-0.5 font-bold text-[#ef4444]">
              <Clock size={8} />
              EXPIRED
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onRevoke}
        title="Cabut assignment"
        className="grid h-7 w-7 place-items-center rounded-md text-[var(--y-text-mute)] transition-colors hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-danger)]"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// =====================================================
// PERMISSION TOGGLE
// =====================================================
function PermToggle({
  active, onClick, label, color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase transition-all",
        active
          ? "border-transparent text-white"
          : "border-[var(--y-border)] text-[var(--y-text-mute)] hover:border-[var(--y-text-dim)]",
      )}
      style={active ? { background: color } : undefined}
    >
      {label}
    </button>
  );
}