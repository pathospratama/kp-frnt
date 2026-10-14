"use client";

import { useRef, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { motion } from "framer-motion";
import { useYudit } from "@/lib/yudit/store";
import { cn } from "@/lib/utils";

export function Dropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);
  const uploadFiles = useYudit((s) => s.uploadFiles);
  const drives = useYudit((s) => s.drives);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFiles(Array.from(files));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragover(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5"
    >
      <button
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragover(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragover(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragover(false);
        }}
        onDrop={onDrop}
        className={cn(
          "group flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-all",
          dragover
            ? "border-[var(--y-primary)] bg-[rgba(99,102,241,0.08)]"
            : "border-[var(--y-border)] bg-[rgba(17,24,53,0.3)] hover:border-[var(--y-primary)] hover:bg-[rgba(99,102,241,0.05)]",
        )}
      >
        <div
          className={cn(
            "mb-2 grid h-14 w-14 place-items-center rounded-2xl transition-transform",
            dragover ? "scale-110" : "group-hover:scale-105",
          )}
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.15))",
            boxShadow: "0 8px 24px var(--y-primary-glow)",
          }}
        >
          <UploadCloud size={26} className="text-[var(--y-primary)]" />
        </div>
        <div className="text-sm font-semibold text-[var(--y-text)]">
          Drop file di sini atau klik untuk upload
        </div>
        <div className="mt-1 text-xs text-[var(--y-text-mute)]">
          File otomatis dikategorikan &amp; masuk folder bulanan
          {drives.length === 0 && " • Hubungkan Drive dulu"}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </button>
    </motion.div>
  );
}
