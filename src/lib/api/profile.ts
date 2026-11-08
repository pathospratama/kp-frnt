// src/lib/api/profile.ts
import { api } from "./client";

// =====================================================
// TYPES
// =====================================================
export type GenderType = "male" | "female" | "other" | "prefer_not_to_say";
export type ThemeType = "light" | "dark" | "system";
export type LanguageType = "id" | "en";
export type DigestType = "realtime" | "daily" | "weekly" | "never";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  owner_id: string | null;
  is_active: boolean;
  must_change_password: boolean;

  // Personal
  avatar_url: string | null;
  full_name: string | null;
  phone_number: string | null;
  gender: GenderType | null;
  address: string | null;
  date_of_birth: string | null;
  bio: string | null;

  // Professional
  job_title: string | null;
  department: string | null;
  unit_kerja: string | null;
  employee_id: string | null;
  office_location: string | null;
  joined_organization_at: string | null;

  // Security
  mfa_enabled: boolean;
  last_password_change_at: string | null;

  // Preferences
  theme: ThemeType;
  language: LanguageType;
  timezone: string;
  email_notifications: boolean;
  push_notifications: boolean;
  digest_frequency: DigestType;

  // Meta
  created_at: string;
  updated_at: string | null;
  last_active_at: string | null;
  profile_completed: boolean;
}

export interface PersonalInfoUpdate {
  full_name?: string | null;
  phone_number?: string | null;
  gender?: GenderType | null;
  address?: string | null;
  date_of_birth?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

export interface ProfessionalInfoUpdate {
  job_title?: string | null;
  department?: string | null;
  unit_kerja?: string | null;
  employee_id?: string | null;
  office_location?: string | null;
  joined_organization_at?: string | null;
}

export interface PreferencesUpdate {
  theme?: ThemeType;
  language?: LanguageType;
  timezone?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  digest_frequency?: DigestType;
}

export interface NotificationPrefs {
  file_uploaded: boolean;
  document_assigned: boolean;
  drive_errors: boolean;
  monthly_reports: boolean;
  collaboration_invites: boolean;
  security_alerts: boolean;
  product_updates: boolean;
  updated_at: string;
}

export interface Session {
  id: string;
  device_type: string | null;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  is_current: boolean;
  last_active_at: string;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string | null;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface StorageInfo {
  pool_total: number;
  pool_used: number;
  pool_free: number;
  accounts_count: number;
  files_count: number;
  files_size: number;
  user_own_usage: number;
}

// =====================================================
// API CALLS
// =====================================================
export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/profile/");
  return data;
}

export async function updatePersonalInfo(
  payload: PersonalInfoUpdate,
): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>("/profile/personal", payload);
  return data;
}

export async function updateProfessionalInfo(
  payload: ProfessionalInfoUpdate,
): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>(
    "/profile/professional",
    payload,
  );
  return data;
}

export async function updatePreferences(
  payload: PreferencesUpdate,
): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>(
    "/profile/preferences",
    payload,
  );
  return data;
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const { data } = await api.get<NotificationPrefs>("/profile/notifications");
  return data;
}

export async function updateNotificationPrefs(
  payload: Partial<NotificationPrefs>,
): Promise<NotificationPrefs> {
  const { data } = await api.patch<NotificationPrefs>(
    "/profile/notifications",
    payload,
  );
  return data;
}

export async function listSessions(): Promise<Session[]> {
  const { data } = await api.get<Session[]>("/profile/sessions");
  return data;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await api.delete(`/profile/sessions/${sessionId}`);
}

export async function revokeAllOtherSessions(): Promise<void> {
  await api.delete("/profile/sessions");
}

export async function listActivity(
  limit = 50,
  action?: string,
): Promise<ActivityItem[]> {
  const { data } = await api.get<ActivityItem[]>("/profile/activity", {
    params: { limit, action },
  });
  return data;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const { data } = await api.get<StorageInfo>("/profile/storage");
  return data;
}

export async function changePasswordFromProfile(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post("/profile/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}
