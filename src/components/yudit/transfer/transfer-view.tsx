// src/components/yudit/transfer/transfer-view.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Copy, Crown,
  Loader2, Mail, RefreshCw, ShieldAlert, Users, UserPlus, XCircle,
  ChevronDown, ChevronUp, Clock, X, KeyRound, Upload, Info,
} from "lucide-react";
import { toast } from "sonner";

import {
  cancelTransfer, executeTransfer, listTransfers, requestTransfer,
  verifyTransfer, type Transfer, type TransferStatus,
} from "@/lib/api/transfer";
import { useYudit, isOwner } from "@/lib/yudit/store";
import { formatDateTime } from "@/lib/yudit/utils";
import { cn } from "@/lib/utils";

type Step = "intro" | "target" | "verify" | "confirm" | "executing" | "done";

export function TransferView() {
  const router = useRouter();
  const user = useYudit((s) => s.user);

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTransfer, setActiveTransfer] = useState<Transfer | null>(null);
  const [step, setStep] = useState<Step>("intro");

  // Form states
  const [targetEmail, setTargetEmail] = useState("");
  const [reason, setReason] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOwnerUser = isOwner(user);

  useEffect(() => {
    if (!isOwnerUser) {
      router.push("/");
      return;
    }
    loadTransfers();
  }, [isOwnerUser, router]);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const res = await listTransfers();
      setTransfers(res);
    } catch (e: any) {
      toast.error(e?.detail || "Gagal memuat riwayat transfer");
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!targetEmail.trim()) {
      toast.error("Masukkan email tujuan");
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestTransfer({
        target_email: targetEmail.trim(),
        reason: reason.trim() || undefined,
      });
      toast.success(
        `Kode verifikasi dikirim ke ${user?.email}. Berlaku ${res.message.includes("30 menit") ? "30 menit" : "sementara"}.`,
        { duration: 8000 },
      );
      const detail = await loadTransferDetail(res.transfer_id);
      setActiveTransfer(detail);
      setStep("verify");
    } catch (e: any) {
      toast.error(e?.detail || "Gagal membuat request");
    } finally {
      setSubmitting(false);
    }
  };

  const loadTransferDetail = async (id: string): Promise<Transfer> => {
    const all = await listTransfers();
    const t = all.find((x) => x.id === id);
    if (!t) throw new Error("Transfer tidak ditemukan");
    return t;
  };

  const handleVerify = async () => {
    if (!activeTransfer) return;
    if (verificationCode.length !== 6) {
      toast.error("Kode harus 6 digit");
      return;
    }
    setSubmitting(true);
    try {
      const res = await verifyTransfer({
        transfer_id: activeTransfer.id,
        code: verificationCode.trim(),
      });
      toast.success("Kode benar. Lanjut ke konfirmasi");
      setStep("confirm");
      const updated = await loadTransferDetail(activeTransfer.id);
      setActiveTransfer(updated);
    } catch (e: any) {
      toast.error(e?.detail || "Kode salah", { duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecute = async () => {
    if (!activeTransfer) return;
    setStep("executing");
    try {
      const res = await executeTransfer(activeTransfer.id);
      toast.success("Workspace berhasil dipindahkan!");
      setStep("done");
      await loadTransfers();
    } catch (e: any) {
      toast.error(e?.detail || "Gagal eksekusi transfer", { duration: 8000 });
      setStep("confirm");
    }
  };

  const handleCancel = async () => {
    if (!activeTransfer) return;
    try {
      await cancelTransfer({
        transfer_id: activeTransfer.id,
        reason: "Dibatalkan oleh owner",
      });
      toast.success("Transfer dibatalkan");
      setActiveTransfer(null);
      setStep("intro");
      await loadTransfers();
    } catch (e: any) {
      toast.error(e?.detail || "Gagal cancel");
    }
  };

  const resetFlow = () => {
    setStep("intro");
    setActiveTransfer(null);
    setTargetEmail("");
    setReason("");
    setVerificationCode("");
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="yudit-ambient flex min-h-screen flex-col">
      <header className="y-glass sticky top-0 z-30 border-b border-[var(--y-border)]">
        <div className="y-container flex h-14 items-center gap-3">
          <button
            onClick={() => router.push("/?view=profile")}
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-[var(--y-warning)]" />
            <h1 className="text-sm font-bold text-[var(--y-text)]">
              Transfer Workspace
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="y-container mx-auto max-w-2xl py-6">
          <AnimatePresence mode="wait">
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <InfoCard />

                <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5">
                  <h2 className="mb-3 text-base font-bold text-[var(--y-text)]">
                    Mulai Transfer Baru
                  </h2>
                  <button
                    onClick={() => setStep("target")}
                    className="y-gradient-brand y-glow-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                  >
                    <UserPlus size={16} />
                    Mulai Transfer
                  </button>
                </div>

                {transfers.length > 0 && (
                  <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5">
                    <h2 className="mb-3 text-base font-bold text-[var(--y-text)]">
                      Riwayat Transfer
                    </h2>
                    <div className="space-y-2">
                      {transfers.map((t) => (
                        <TransferRow
                          key={t.id}
                          transfer={t}
                          onResume={(tr) => {
                            setActiveTransfer(tr);
                            if (tr.status === "pending") setStep("verify");
                            else if (tr.status === "verified")
                              setStep("confirm");
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === "target" && (
              <motion.div
                key="target"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5"
              >
                <h2 className="mb-4 text-base font-bold text-[var(--y-text)]">
                  Masukkan Email Target
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase text-[var(--y-text-mute)]">
                      Email User Tujuan
                    </label>
                    <input
                      type="email"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="nama@domain.com"
                      autoFocus
                      className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm text-[var(--y-text)] outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[var(--y-text-mute)]">
                      User harus sudah terdaftar sebagai OWNER di aplikasi ini.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase text-[var(--y-text-mute)]">
                      Alasan (opsional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      placeholder="Contoh: Pergantian pejabat struktural"
                      className="y-focus w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] px-3 py-2 text-sm text-[var(--y-text)] outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep("intro")}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] text-sm font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
                    >
                      <ArrowLeft size={14} />
                      Batal
                    </button>
                    <button
                      onClick={handleRequest}
                      disabled={submitting || !targetEmail.trim()}
                      className="y-gradient-brand inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Mail size={16} />
                      )}
                      Kirim Kode
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "verify" && activeTransfer && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5"
              >
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] p-3">
                  <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[var(--y-warning)]" />
                  <div className="text-[12px] leading-relaxed text-[var(--y-warning)]">
                    <b>Kode dikirim ke email {user?.email}</b>
                    <br />
                    Buka email Anda, salin kode 6 digit, dan masukkan di bawah.
                    JANGAN bagikan kode ini ke siapa pun.
                  </div>
                </div>

                <label className="mb-1.5 block text-[11px] font-bold uppercase text-[var(--y-text-mute)]">
                  Kode Verifikasi
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="y-focus h-16 w-full rounded-xl border-2 border-[var(--y-border)] bg-[var(--y-bg)] text-center font-mono text-3xl font-bold tracking-[0.5em] text-[var(--y-text)] outline-none focus:border-[var(--y-primary)]"
                />

                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--y-text-mute)]">
                    Sisa percobaan: {activeTransfer.max_attempts - activeTransfer.code_attempts}
                  </span>
                  <span className="text-[var(--y-text-mute)]">
                    Kode berlaku s/d {formatDateTime(activeTransfer.code_expires_at)}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] text-sm font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
                  >
                    <X size={14} />
                    Batalkan
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={submitting || verificationCode.length !== 6}
                    className="y-gradient-brand inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <KeyRound size={16} />
                    )}
                    Verifikasi
                  </button>
                </div>
              </motion.div>
            )}

            {step === "confirm" && activeTransfer && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border-2 border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] p-5"
              >
                <div className="mb-4 flex items-start gap-3">
                  <AlertTriangle
                    size={22}
                    className="mt-0.5 shrink-0 text-[var(--y-danger)]"
                  />
                  <div>
                    <h2 className="text-base font-bold text-[var(--y-text)]">
                      Konfirmasi Terakhir
                    </h2>
                    <p className="mt-1 text-[12px] text-[var(--y-text-dim)]">
                      Tindakan ini akan memindahkan SELURUH workspace Anda ke user
                      lain. Anda akan menjadi MEMBER di workspace tersebut.
                    </p>
                  </div>
                </div>

                <div className="mb-4 space-y-1.5 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] p-4 text-[12.5px]">
                  <Row label="Dari" value={`${activeTransfer.from_owner_username} (${activeTransfer.from_owner_email})`} />
                  <Row label="Ke" value={`${activeTransfer.to_owner_username} (${activeTransfer.to_owner_email})`} />
                  {activeTransfer.snapshot_before && (
                    <>
                      <div className="my-2 border-t border-[var(--y-border-soft)]" />
                      <Row
                        label="Drive"
                        value={`${(activeTransfer.snapshot_before as any).drives || 0} akun Google Drive`}
                      />
                      <Row
                        label="Collaborator"
                        value={`${(activeTransfer.snapshot_before as any).collaborators || 0} user`}
                      />
                      <Row
                        label="File"
                        value={`${(activeTransfer.snapshot_before as any).files || 0} file`}
                      />
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={handleCancel}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] text-sm font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
                  >
                    <X size={14} />
                    Batalkan Transfer
                  </button>
                  <button
                    onClick={handleExecute}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--y-danger)] text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#dc2626]"
                  >
                    <CheckCircle2 size={16} />
                    Ya, Transfer Sekarang
                  </button>
                </div>
              </motion.div>
            )}

            {step === "executing" && (
              <motion.div
                key="executing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-8 text-center"
              >
                <Loader2
                  size={48}
                  className="mx-auto animate-spin text-[var(--y-primary)]"
                />
                <h2 className="mt-4 text-base font-bold text-[var(--y-text)]">
                  Memindahkan Workspace…
                </h2>
                <p className="mt-1 text-[12px] text-[var(--y-text-dim)]">
                  Mohon tunggu, sedang memindahkan file, drive, dan collaborator.
                  Jangan tutup halaman ini.
                </p>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] p-8 text-center"
              >
                <CheckCircle2
                  size={48}
                  className="mx-auto text-[var(--y-success)]"
                />
                <h2 className="mt-4 text-base font-bold text-[var(--y-text)]">
                  Transfer Berhasil!
                </h2>
                <p className="mt-1 text-[12px] text-[var(--y-text-dim)]">
                  Anda sekarang menjadi MEMBER di workspace baru. Login ulang
                  untuk melihat workspace dari sisi member.
                </p>
                <button
                  onClick={() => {
                    useYudit.getState().logout();
                    router.push("/");
                  }}
                  className="y-gradient-brand mt-4 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
                >
                  <RefreshCw size={14} />
                  Login Ulang
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// =====================================================
// SUB-COMPONENTS
// =====================================================
function InfoCard() {
  return (
    <div className="rounded-2xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)] p-5">
      <div className="mb-3 flex items-start gap-3">
        <AlertTriangle size={22} className="mt-0.5 shrink-0 text-[var(--y-warning)]" />
        <div>
          <h2 className="text-base font-bold text-[var(--y-text)]">
            Perhatian
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--y-text-dim)]">
            Fitur ini memindahkan <b>seluruh workspace</b> Anda — termasuk{" "}
            <b>Google Drive</b>, <b>collaborator</b>, dan <b>semua file</b> —
            ke user lain. Anda akan menjadi MEMBER setelah transfer selesai.
          </p>
        </div>
      </div>

      <div className="space-y-1.5 text-[12px] text-[var(--y-text-dim)]">
        <div className="flex items-start gap-2">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--y-success)]" />
          <span>Kode verifikasi dikirim ke email <b>Anda</b> (bukan ke target)</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--y-success)]" />
          <span>Target harus sudah terdaftar sebagai OWNER di aplikasi</span>
        </div>
        <div className="flex items-start gap-2">
          <XCircle size={14} className="mt-0.5 shrink-0 text-[var(--y-danger)]" />
          <span>Tindakan ini <b>tidak bisa dibatalkan</b> setelah eksekusi</span>
        </div>
      </div>
    </div>
  );
}

function TransferRow({
  transfer,
  onResume,
}: {
  transfer: Transfer;
  onResume: (t: Transfer) => void;
}) {
  const statusMeta: Record<TransferStatus, { label: string; color: string }> = {
    pending: { label: "Menunggu Verifikasi", color: "#f59e0b" },
    verified: { label: "Siap Dieksekusi", color: "#22d3ee" },
    executing: { label: "Sedang Diproses", color: "#6366f1" },
    completed: { label: "Selesai", color: "#10b981" },
    failed: { label: "Gagal", color: "#ef4444" },
    cancelled: { label: "Dibatalkan", color: "#94a3b8" },
    expired: { label: "Kadaluarsa", color: "#94a3b8" },
  };
  const meta = statusMeta[transfer.status] || statusMeta.pending;
  const canResume = transfer.status === "pending" || transfer.status === "verified";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] p-3">
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ background: `${meta.color}22`, color: meta.color }}
      >
        <Crown size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-[var(--y-text)]">
          → {transfer.to_owner_email}
        </div>
        <div className="text-[10.5px] text-[var(--y-text-mute)]">
          {meta.label} · {formatDateTime(transfer.created_at)}
        </div>
      </div>
      {canResume && (
        <button
          onClick={() => onResume(transfer)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--y-primary)] px-2.5 text-[11px] font-semibold text-white hover:opacity-90"
        >
          Lanjutkan
        </button>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 font-semibold text-[var(--y-text-mute)]">
        {label}:
      </span>
      <span className="min-w-0 break-words text-[var(--y-text)]">{value}</span>
    </div>
  );
}