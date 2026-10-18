// src/lib/yudit/types.ts
export type ViewKey = "files" | "monthly" | "stats" | "drives";

export interface User {
  id: string;
  username: string;
  email: string;
}

/** Mirror dari ApiFile backend */
export interface FileItem {
  id: string;
  name: string;
  mime_type: string | null;
  size: number;
  category: string | null;
  category_confidence?: number;
  folder_id: string | null;
  folder_name: string | null;
  monthly_folder_id?: string | null;
  year: number;
  month: number;
  day?: number;
  created_at: string;
  updated_at?: string;
  drive_account_id: string;
  file_type?: string | null;
  is_public: boolean;
  share_token: string | null;
  share_expires_at?: string | null;
  share_views: number;
}

export interface DriveAccount {
  id: string;
  google_email: string;
  display_name?: string | null;
  slot_index: number;
  is_active: boolean;
  quota_total: number;
  quota_used: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  is_builtin: boolean;
}

export interface Filters {
  year?: number;
  month?: number;
  day?: number;
  date_from?: string;
  date_to?: string;
  file_type?: string;
  sort_by?: "created_at" | "name" | "size" | "year" | "month";
  sort_order?: "asc" | "desc";
}

export interface PoolInfo {
  total: number;
  used: number;
  free: number;
  accounts: number;
}

export interface Stats {
  total_files: number;
  total_size: number;
  by_year: Record<string, number>;
  by_month: Record<string, number>;
  by_category: Record<string, number>;
  by_type: Record<string, number>;
  by_day?: Record<string, number>;
}

export interface ShareConfig {
  expires_hours: number | null;
  password: string | null;
}