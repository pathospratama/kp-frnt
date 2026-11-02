<<<<<<< HEAD
// src/components/yudit/ui/progress-overlay.tsx
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useYudit } from "@/lib/yudit/store";

export function ProgressOverlay() {
  const progress = useYudit((s) => s.progress);
  const pct = progress.pct;
<<<<<<< HEAD
  const isIndeterminate = pct === null;
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9

  return (
    <AnimatePresence>
      {progress.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] grid place-items-center p-6"
<<<<<<< HEAD
          style={{
            background: "rgba(10, 15, 31, 0.82)",
            backdropFilter: "blur(8px)",
          }}
=======
          style={{ background: "rgba(10, 15, 31, 0.82)", backdropFilter: "blur(8px)" }}
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="y-glass-strong y-glow-soft w-full max-w-sm rounded-2xl border border-[var(--y-border)] p-8 text-center"
          >
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full">
              <Loader2 size={32} className="y-spin text-[var(--y-primary)]" />
            </div>
            <div className="mb-1 text-sm font-semibold text-[var(--y-text)]">
              {progress.label}
            </div>
            <div className="mb-4 truncate text-xs text-[var(--y-text-dim)]">
              {progress.sub}
            </div>
<<<<<<< HEAD

            {/* ============================================
                PROGRESS BAR
                - Indeterminate (pct === null): pulse animation
                - Determinate: smooth width animation
                ============================================ */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--y-bg)]">
              {isIndeterminate ? (
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--y-primary), var(--y-accent))",
                  }}
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  initial={{ width: "40%" }}
                />
              ) : (
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--y-primary), var(--y-accent))",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              )}
            </div>

            {/* Percentage label untuk determinate */}
            {!isIndeterminate && typeof pct === "number" && (
              <div className="mt-2 text-[11px] font-semibold tabular-nums text-[var(--y-text-mute)]">
                {pct}%
              </div>
            )}
=======
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--y-bg)]">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, var(--y-primary), var(--y-accent))",
                }}
                animate={{
                  width:
                    pct === null
                      ? ["20%", "60%", "85%", "60%"]
                      : `${pct}%`,
                }}
                transition={
                  pct === null
                    ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.3 }
                }
              />
            </div>
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
