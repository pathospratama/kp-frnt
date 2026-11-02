"use client";

import { fileIconInfo } from "@/lib/yudit/utils";
import { cn } from "@/lib/utils";

interface FileIconProps {
  mime: string;
  name?: string;
  size?: number;
  className?: string;
}

export function FileIcon({ mime, name = "", size = 20, className }: FileIconProps) {
  const { Icon, color, bg } = fileIconInfo(mime, name);
  return (
    <div
      className={cn(
        "grid place-items-center rounded-lg shrink-0",
        className,
      )}
      style={{
        width: size + 12,
        height: size + 12,
        background: bg,
      }}
    >
      <Icon size={size} style={{ color }} strokeWidth={2} />
    </div>
  );
}
