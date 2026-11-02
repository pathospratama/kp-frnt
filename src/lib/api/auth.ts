// src/lib/api/auth.ts
import { api } from "./client";

<<<<<<< HEAD
// =====================================================
// TYPES
// =====================================================
export type UserRole = "owner" | "super_admin" | "member";

export interface ApiUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  owner_id: string | null;
  must_change_password?: boolean;
  is_active?: boolean;
=======
export interface User {
  id: string;
  email: string;
  username: string;
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
<<<<<<< HEAD
  user: ApiUser;
=======
  user: User;
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

<<<<<<< HEAD
export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

// =====================================================
// AUTH ENDPOINTS
// =====================================================
=======
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

<<<<<<< HEAD
export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

/**
 * Ganti password user yang sedang login.
 * Dipakai untuk collaborator baru yang wajib ganti password default (123456).
 */
export async function changePassword(
  current_password: string,
  new_password: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    "/auth/change-password",
    { current_password, new_password },
  );
  return data;
=======
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
>>>>>>> 8c616f16953e326d6ebb48d2ae07dd1f54cc1be9
}