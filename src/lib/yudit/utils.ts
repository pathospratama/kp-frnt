import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  FileSpreadsheet,
  Presentation,
  Code2,
  File,
  FileType2,
} from "lucide-react";

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function extOf(name: string): string {
  return (name.split(".").pop() || "").toLowerCase();
}

export interface FileIconInfo {
  Icon: LucideIcon;
  color: string;
  bg: string;
}

export function fileIconInfo(
  mime: string,
  name = "",
): FileIconInfo {
  const ext = extOf(name);
  if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic"].includes(ext)
  ) {
    return {
      Icon: ImageIcon,
      color: "#22d3ee",
      bg: "rgba(34, 211, 238, 0.12)",
    };
  }
  if (
    mime.startsWith("video/") ||
    ["mp4", "mkv", "mov", "avi", "webm"].includes(ext)
  ) {
    return {
      Icon: Film,
      color: "#f87171",
      bg: "rgba(239, 68, 68, 0.12)",
    };
  }
  if (
    mime.startsWith("audio/") ||
    ["mp3", "wav", "flac", "m4a", "ogg"].includes(ext)
  ) {
    return {
      Icon: Music,
      color: "#e879f9",
      bg: "rgba(217, 70, 239, 0.12)",
    };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return {
      Icon: Archive,
      color: "#d6d3d1",
      bg: "rgba(120, 113, 108, 0.18)",
    };
  }
  if (ext === "pdf") {
    return {
      Icon: FileType2,
      color: "#f87171",
      bg: "rgba(239, 68, 68, 0.12)",
    };
  }
  if (["doc", "docx", "odt", "rtf"].includes(ext)) {
    return {
      Icon: FileText,
      color: "#60a5fa",
      bg: "rgba(59, 130, 246, 0.12)",
    };
  }
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) {
    return {
      Icon: FileSpreadsheet,
      color: "#34d399",
      bg: "rgba(16, 185, 129, 0.12)",
    };
  }
  if (["ppt", "pptx", "odp"].includes(ext)) {
    return {
      Icon: Presentation,
      color: "#fbbf24",
      bg: "rgba(245, 158, 11, 0.12)",
    };
  }
  if (
    ["js", "ts", "py", "html", "css", "json", "sh", "java", "go", "sql", "xml", "md", "txt"].includes(
      ext,
    )
  ) {
    return {
      Icon: Code2,
      color: "#a5b4fc",
      bg: "rgba(99, 102, 241, 0.12)",
    };
  }
  return {
    Icon: File,
    color: "#94a3b8",
    bg: "rgba(100, 116, 139, 0.12)",
  };
}

export interface CategoryMeta {
  icon: string;
  cls: string;
  color: string;
  bg: string;
  border: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  "Surat Masuk": {
    icon: "📥",
    cls: "cat-surat-masuk",
    color: "#34d399",
    bg: "rgba(16, 185, 129, 0.14)",
    border: "rgba(16, 185, 129, 0.3)",
  },
  "Surat Keluar": {
    icon: "📤",
    cls: "cat-surat-keluar",
    color: "#60a5fa",
    bg: "rgba(59, 130, 246, 0.14)",
    border: "rgba(59, 130, 246, 0.3)",
  },
  "BA (Berita Acara)": {
    icon: "📋",
    cls: "cat-ba",
    color: "#fbbf24",
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.3)",
  },
  "Surat Keputusan Pimpinan": {
    icon: "⚖️",
    cls: "cat-sk-pimpinan",
    color: "#a78bfa",
    bg: "rgba(139, 92, 246, 0.14)",
    border: "rgba(139, 92, 246, 0.3)",
  },
  "Surat Keputusan DPRD": {
    icon: "🏛️",
    cls: "cat-sk-dprd",
    color: "#f472b6",
    bg: "rgba(236, 72, 153, 0.14)",
    border: "rgba(236, 72, 153, 0.3)",
  },
  "Surat Persetujuan Bersama": {
    icon: "🤝",
    cls: "cat-persetujuan",
    color: "#22d3ee",
    bg: "rgba(6, 182, 212, 0.14)",
    border: "rgba(6, 182, 212, 0.3)",
  },
  "SPJ (Surat Pertanggungjawaban)": {
    icon: "💰",
    cls: "cat-spj",
    color: "#facc15",
    bg: "rgba(234, 179, 8, 0.14)",
    border: "rgba(234, 179, 8, 0.3)",
  },
  "Notulen Banmus": {
    icon: "📝",
    cls: "cat-notulen-banmus",
    color: "#2dd4bf",
    bg: "rgba(20, 184, 166, 0.14)",
    border: "rgba(20, 184, 166, 0.3)",
  },
  "Notulen Bapemperda": {
    icon: "📝",
    cls: "cat-notulen-bapem",
    color: "#c084fc",
    bg: "rgba(168, 85, 247, 0.14)",
    border: "rgba(168, 85, 247, 0.3)",
  },
  "Notulen Pansus": {
    icon: "📝",
    cls: "cat-notulen-pansus",
    color: "#fb7185",
    bg: "rgba(244, 63, 94, 0.14)",
    border: "rgba(244, 63, 94, 0.3)",
  },
  Dokumen: {
    icon: "📄",
    cls: "cat-dokumen",
    color: "#93c5fd",
    bg: "rgba(96, 165, 250, 0.14)",
    border: "rgba(96, 165, 250, 0.3)",
  },
  Gambar: {
    icon: "🖼️",
    cls: "cat-gambar",
    color: "#67e8f9",
    bg: "rgba(34, 211, 238, 0.14)",
    border: "rgba(34, 211, 238, 0.3)",
  },
  Video: {
    icon: "🎬",
    cls: "cat-video",
    color: "#f87171",
    bg: "rgba(239, 68, 68, 0.14)",
    border: "rgba(239, 68, 68, 0.3)",
  },
  Audio: {
    icon: "🎵",
    cls: "cat-audio",
    color: "#e879f9",
    bg: "rgba(217, 70, 239, 0.14)",
    border: "rgba(217, 70, 239, 0.3)",
  },
  Arsip: {
    icon: "📦",
    cls: "cat-arsip",
    color: "#d6d3d1",
    bg: "rgba(120, 113, 108, 0.2)",
    border: "rgba(120, 113, 108, 0.3)",
  },
  Spreadsheet: {
    icon: "📗",
    cls: "cat-lainnya",
    color: "#34d399",
    bg: "rgba(16, 185, 129, 0.14)",
    border: "rgba(16, 185, 129, 0.3)",
  },
  Presentasi: {
    icon: "📙",
    cls: "cat-lainnya",
    color: "#fbbf24",
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.3)",
  },
  Kode: {
    icon: "💻",
    cls: "cat-lainnya",
    color: "#a5b4fc",
    bg: "rgba(99, 102, 241, 0.14)",
    border: "rgba(99, 102, 241, 0.3)",
  },
  Lainnya: {
    icon: "📄",
    cls: "cat-lainnya",
    color: "#94a3b8",
    bg: "rgba(100, 116, 139, 0.14)",
    border: "rgba(100, 116, 139, 0.3)",
  },
};

export function getCategoryMeta(
  cat: string | null,
  customCats: { name: string; icon: string }[] = [],
): CategoryMeta {
  if (!cat)
    return {
      icon: "📄",
      cls: "cat-lainnya",
      color: "#94a3b8",
      bg: "rgba(100, 116, 139, 0.14)",
      border: "rgba(100, 116, 139, 0.3)",
    };
  if (CATEGORY_META[cat]) return CATEGORY_META[cat];
  const custom = customCats.find((c) => c.name === cat);
  return {
    icon: custom?.icon || "📄",
    cls: "cat-custom",
    color: "#a5b4fc",
    bg: "rgba(99, 102, 241, 0.14)",
    border: "rgba(99, 102, 241, 0.3)",
  };
}
// src/lib/yudit/utils.ts — TAMBAHKAN di bagian bawah (setelah getCategoryMeta)

export function getCategoryMetaSafe(
  cat: string | null,
  customCats: { name: string; icon: string; color?: string }[] = [],
): CategoryMeta {
  if (!cat) {
    return {
      icon: "📄",
      cls: "cat-lainnya",
      color: "#94a3b8",
      bg: "rgba(100, 116, 139, 0.14)",
      border: "rgba(100, 116, 139, 0.3)",
    };
  }
  if (CATEGORY_META[cat]) return CATEGORY_META[cat];
  const custom = customCats.find((c) => c.name === cat);
  return {
    icon: custom?.icon || "📄",
    cls: "cat-custom",
    color: custom?.color || "#a5b4fc",
    bg: "rgba(99, 102, 241, 0.14)",
    border: "rgba(99, 102, 241, 0.3)",
  };
}

export function detectCategory(
  name: string,
  mime: string,
): string {
  const ext = extOf(name);
  const lower = name.toLowerCase();

  const RULES: { cat: string; test: () => boolean }[] = [
    { cat: "Surat Masuk", test: () => /surat\s*masuk|incoming|masuk/i.test(lower) },
    { cat: "Surat Keluar", test: () => /surat\s*keluar|outgoing|keluar/i.test(lower) },
    { cat: "BA (Berita Acara)", test: () => /berita\s*acara|\bba\b|\bnotula/i.test(lower) },
    {
      cat: "Surat Keputusan Pimpinan",
      test: () => /keputusan\s*pimpinan|sk\s*pimpinan/i.test(lower),
    },
    { cat: "Surat Keputusan DPRD", test: () => /keputusan\s*dprd|sk\s*dprd/i.test(lower) },
    {
      cat: "Surat Persetujuan Bersama",
      test: () => /persetujuan\s*bersama/i.test(lower),
    },
    {
      cat: "SPJ (Surat Pertanggungjawaban)",
      test: () => /spj|pertanggungjawab/i.test(lower),
    },
    { cat: "Notulen Banmus", test: () => /notulen\s*banmus|banmus/i.test(lower) },
    {
      cat: "Notulen Bapemperda",
      test: () => /notulen\s*bapem|bapemperda/i.test(lower),
    },
    { cat: "Notulen Pansus", test: () => /notulen\s*pansus|pansus/i.test(lower) },
  ];

  for (const r of RULES) {
    if (r.test()) return r.cat;
  }

  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return "Gambar";
  if (mime.startsWith("video/") || ["mp4", "mov", "mkv", "webm"].includes(ext))
    return "Video";
  if (mime.startsWith("audio/") || ["mp3", "wav", "flac", "m4a"].includes(ext))
    return "Audio";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "Arsip";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "Spreadsheet";
  if (["ppt", "pptx", "odp"].includes(ext)) return "Presentasi";
  if (["js", "ts", "py", "html", "css", "json", "sh", "sql", "xml"].includes(ext))
    return "Kode";
  if (["pdf", "doc", "docx", "odt", "rtf", "txt", "md"].includes(ext)) return "Dokumen";
  return "Lainnya";
}

export const FILE_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "doc", label: "Word (.doc)" },
  { value: "docx", label: "Word (.docx)" },
  { value: "xls", label: "Excel (.xls)" },
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "csv", label: "CSV" },
  { value: "ppt", label: "PowerPoint (.ppt)" },
  { value: "pptx", label: "PowerPoint (.pptx)" },
  { value: "jpg", label: "JPG" },
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "gif", label: "GIF" },
  { value: "webp", label: "WebP" },
  { value: "mp4", label: "Video MP4" },
  { value: "mov", label: "Video MOV" },
  { value: "mkv", label: "Video MKV" },
  { value: "mp3", label: "Audio MP3" },
  { value: "wav", label: "Audio WAV" },
  { value: "zip", label: "ZIP" },
  { value: "rar", label: "RAR" },
  { value: "7z", label: "7Z" },
  { value: "txt", label: "Text" },
  { value: "md", label: "Markdown" },
  { value: "json", label: "JSON" },
];

export function genId(prefix = "id"): string {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function genToken(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  );
}
