// src/lib/api/categories.ts
import { api } from "./client";

export interface ApiCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  is_default?: boolean;
  is_builtin?: boolean;
  created_at?: string;
}

export interface CategoriesListResponse {
  default: ApiCategory[];
  custom: ApiCategory[];
  all: string[];
}

export interface CategoryPayload {
  name: string;
  icon?: string;
  color?: string;
  keywords?: string[];
}

export async function listCategories(): Promise<CategoriesListResponse> {
  const { data } = await api.get<CategoriesListResponse>("/categories/");
  return data;
}

export async function createCategory(payload: CategoryPayload): Promise<ApiCategory> {
  const { data } = await api.post<ApiCategory>("/categories/", payload);
  return data;
}

export async function updateCategory(
  id: string,
  payload: Partial<CategoryPayload>,
): Promise<ApiCategory> {
  const { data } = await api.patch<ApiCategory>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
}