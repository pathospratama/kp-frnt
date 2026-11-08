// src/lib/yudit/types.ts
export type ViewKey =
  | "files"
  | "monthly"
  | "stats"
  | "drives"
  | "convert"
  | "collaborators"
  | "my-tasks"
  | "profile";   // ⭐ TAMBAH

// =====================================================
// FILE
// =====================================================
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
  

  // ⭐ Nullable — backend bisa kirim null untuk file legacy
  year: number | null;
  month: number | null;
  day?: number | null;

  created_at: string;
  updated_at?: string;
  drive_account_id: string;
  file_type?: string | null;
  is_public: boolean;
  share_token: string | null;
  share_expires_at?: string | null;
  share_views: number;
  parent_file_id?: string | null;
  derived_from_operation?: string | null;

  // ⭐ Permission flags dari backend (annotate_files_for_user)
  can_edit_to_me?: boolean;
  can_delete_to_me?: boolean;
  can_share_to_me?: boolean;

  // =====================================================
  // GOOGLE DOCS NATIVE
  // =====================================================
  google_doc_id?: string | null;
  editor_mode?: "local" | "google_docs";
  is_editable?: boolean;
  content_hash?: string | null;
  last_edited_at?: string | null;
}

// =====================================================
// DRIVE
// =====================================================
export interface DriveAccount {
  id: string;
  google_email: string;
  display_name?: string | null;
  slot_index: number;
  is_active: boolean;
  /** ⭐ NEW — backend filter out yang true, tapi tetap disediakan untuk defensiveness */
  is_deleted?: boolean;
  quota_total: number;
  quota_used: number;
  /** ⭐ NEW — untuk display "Quota diperbarui <tanggal>" */
  quota_updated_at?: string | null;
  /** ⭐ NEW */
  created_at?: string;
}

// =====================================================
// CATEGORY
// =====================================================
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  is_builtin: boolean;
}

// =====================================================
// FILTERS
// =====================================================
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

// =====================================================
// POOL & STATS
// =====================================================
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

// =====================================================
// CONVERSION
// =====================================================
export type ConversionOperation =
  | "merge_pdf"
  | "split_pdf"
  | "compress_pdf"
  | "jpg_to_pdf"
  | "word_to_pdf"
  | "scan_to_pdf"
  | "pdf_to_jpg"
  | "pdf_to_word"
  | "ocr_pdf"
  | "pdf_to_markdown";

export interface ConversionJob {
  id: string;
  user_id: string;
  source_file_id: string;
  result_file_id: string | null;
  operation: ConversionOperation;
  status: "pending" | "processing" | "success" | "failed";
  params: Record<string, unknown>;
  error_message: string | null;
  provider: string;
  provider_task_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ConversionOperationInfo {
  key: ConversionOperation;
  tool: string;
  accepted_mime: string[];
  provider?: "ilovepdf" | "local";
}

export interface ConversionResult {
  job_id: string;
  status: "success";
  source_files: string[];
  result_file: FileItem;
  operation: ConversionOperation;
}

// =====================================================
// GOOGLE DOCS
// =====================================================
export type EditorMode = "local" | "google_docs" | "preview";

export interface GoogleDocInfo {
  google_doc_id: string;
  web_view_link: string;
  embed_url: string;
  edit_url: string;
  name: string;
  existing: boolean;
}

// =====================================================
// USER & COLLABORATION
// =====================================================
export type UserRole = "owner" | "super_admin" | "member";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  owner_id: string | null;
  must_change_password?: boolean;
}

export type CollaboratorRole = "super_admin" | "member";

export interface Collaborator {
  id: string;
  email: string;
  username: string;
  role: CollaboratorRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  created_by: string | null;
}

export interface DocumentAssignment {
  id: string;
  file_id: string;
  assigned_to: string;
  assigned_by: string;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  note: string | null;
  expires_at: string | null;
  created_at: string;
  assigned_to_user?: {
    id: string;
    email: string;
    username: string;
  };
  file?: FileItem;
}
