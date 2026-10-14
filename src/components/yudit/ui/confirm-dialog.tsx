"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import { Button } from "@/components/ui/button";

export function ConfirmDialog() {
  const dialog = useYudit((s) => s.confirmDialog);
  const closeConfirm = useYudit((s) => s.closeConfirm);

  return (
    <AnimatePresence>
      {dialog.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[998] grid place-items-center p-5"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={closeConfirm}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="y-glass-strong y-glow-soft w-full max-w-[400px] rounded-2xl border border-[var(--y-border)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgba(245,158,11,0.15)]">
                <AlertTriangle size={20} className="text-[var(--y-warn)]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[var(--y-text)]">
                  {dialog.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--y-text-dim)]">
                  {dialog.text}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={closeConfirm}
                className="text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
              >
                Batal
              </Button>
              <button
                onClick={() => {
                  dialog.onConfirm?.();
                  closeConfirm();
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--y-danger)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#dc2626]"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
