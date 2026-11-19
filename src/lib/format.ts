// src/lib/format.ts
/**
 * Formatter utilities untuk UI upload.
 */

/**
 * Format bytes → human readable (B, KB, MB, GB, TB).
 */
export function formatBytes(bytes: number | undefined | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, i);
  // Tampilkan 1 desimal kalau <10, 0 desimal kalau >=10
  const decimals = value < 10 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[i]}`;
}

/**
 * Format speed (B/s) → human readable.
 */
export function formatSpeed(bps: number | undefined | null): string {
  if (!bps || bps <= 0) return "-";
  return `${formatBytes(bps)}/s`;
}

/**
 * Format ETA (detik) → "5s", "1m 23s", "1h 5m".
 */
export function formatEta(seconds: number | undefined | null): string {
  if (seconds == null || seconds <= 0) return "-";
  if (seconds < 1) return "<1s";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;

  const total = Math.ceil(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
}

/**
 * Format elapsed (detik) → "12s", "1m 5s".
 */
export function formatElapsed(seconds: number | undefined | null): string {
  if (seconds == null || seconds < 0) return "0s";
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

/**
 * Truncate file name supaya muat di UI.
 */
export function truncateName(name: string, max = 40): string {
  if (name.length <= max) return name;
  const ext = name.includes(".")
    ? name.slice(name.lastIndexOf("."))
    : "";
  const base = name.slice(0, name.length - ext.length);
  const head = Math.floor((max - ext.length - 3) / 2);
  const tail = max - ext.length - 3 - head;
  return `${base.slice(0, head)}...${base.slice(-tail)}${ext}`;
}