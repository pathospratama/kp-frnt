"use client";

import { getCategoryMeta } from "@/lib/yudit/utils";
import { useYudit } from "@/lib/yudit/store";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: string | null;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const customCats = useYudit((s) => s.customCategories);
  if (!category) return null;
  const meta = getCategoryMeta(category, customCats);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold leading-tight max-w-[160px] truncate",
        className,
      )}
      style={{
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
      title={category}
    >
      <span className="shrink-0">{meta.icon}</span>
      <span className="truncate">{category}</span>
    </span>
  );
}
