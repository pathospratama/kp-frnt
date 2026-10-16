// src/lib/yudit/store.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  DriveAccount,
  FileItem,
  Filters,
  PoolInfo,
  RoleKey,
  User,
  ViewKey,
} from "./types";
import * as authApi from "@/lib/api/auth";
import * as filesApi from "@/lib/api/files";
import * as drivesApi from "@/lib/api/drives";
import * as catApi from "@/lib/api/categories";
import * as shareApi from "@/lib/api/share";
import {
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  ApiError,
} from "@/lib/api/client";

// =====================================================
// TOAST BRIDGE
// =====================================================
type ToastFn = (msg: string, type?: "success" | "error" | "info") => void;
let toastFn: ToastFn | null = null;
export function registerToast(fn: ToastFn) {
  toastFn = fn;
}
function toast(msg: string, type: "success" | "error" | "info" = "info") {
  toastFn?.(msg, type);
}

// =====================================================
// STATE INTERFACE
// =====================================================
interface YuditState {
  // auth
  isAuthenticated: boolean;
  user: User | null;
  authLoading: boolean;

  // views
  currentView: ViewKey;
  sidebarOpen: boolean;
  role: RoleKey;
  arsipTab: "daftar" | "bulanan";

  // data
  drives: DriveAccount[];
  pool: PoolInfo;
  files: FileItem[];
  customCategories: catApi.ApiCategory[];
  defaultCategories: catApi.ApiCategory[];

  // loading flags
  filesLoading: boolean;
  drivesLoading: boolean;
  quotaRefreshing: boolean;   // ← BARU

  // files view state
  currentCategory: string;
  searchQuery: string;
  monthlySearchQuery: string;
  filters: Filters;
  filterPanelOpen: boolean;
  expandedMonthly: Record<string, boolean>;

  // modals
  previewFileId: string | null;
  shareFileId: string | null;
  categoryManagerOpen: boolean;
  confirmDialog: {
    open: boolean;
    title: string;
    text: string;
    onConfirm: (() => void) | null;
  };
  progress: {
    open: boolean;
    label: string;
    sub: string;
    pct: number | null;
  };

  // ============ ACTIONS ============
  // auth
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  bootstrapAuth: () => void;

  // views
  setView: (v: ViewKey) => void;
  setSidebarOpen: (open: boolean) => void;
  setRole: (r: RoleKey) => void;
  setArsipTab: (t: "daftar" | "bulanan") => void;

  // data fetch
  fetchFiles: (params?: filesApi.FileListParams) => Promise<void>;
  fetchDrives: () => Promise<void>;
  fetchCategories: () => Promise<void>;

  // drives
  refreshPool: () => Promise<void>;
  refreshQuota: () => Promise<void>;   // ← BARU: force refresh quota
  removeDrive: (id: string) => Promise<void>;

  // files
  uploadFiles: (files: File[]) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  updateFileCategory: (id: string, category: string) => Promise<void>;

  // filters
  setCategory: (cat: string) => void;
  setSearch: (q: string) => void;
  setMonthlySearch: (q: string) => void;
  setFilters: (f: Filters) => void;
  resetFilters: () => void;
  setFilterPanelOpen: (open: boolean) => void;

  // monthly
  toggleMonthly: (key: string) => void;
  collapseAllMonthly: () => void;
  expandAllMonthly: () => void;

  // modals
  openPreview: (id: string) => void;
  closePreview: () => void;
  openShare: (id: string) => void;
  closeShare: () => void;
  createShare: (cfg: {
    expires_hours: number | null;
    password: string | null;
  }) => Promise<void>;
  revokeShare: (id: string) => Promise<void>;

  // categories
  setCategoryManagerOpen: (open: boolean) => void;
  addCustomCategory: (
    name: string,
    icon: string,
    keywords: string[],
  ) => Promise<void>;
  removeCustomCategory: (id: string) => Promise<void>;

  // ui
  showConfirm: (title: string, text: string, onConfirm: () => void) => void;
  closeConfirm: () => void;
  showProgress: (label: string, sub: string, pct?: number | null) => void;
  hideProgress: () => void;
}

const EMPTY_POOL: PoolInfo = { total: 0, used: 0, free: 0, accounts: 0 };

// =====================================================
// STORE
// =====================================================
export const useYudit = create<YuditState>()(
  persist(
    (set, get) => ({
      // ---- initial state ----
      isAuthenticated: false,
      user: null,
      authLoading: false,

      currentView: "arsip",
      sidebarOpen: false,
      role: "pegawai",
      arsipTab: "daftar",

      drives: [],
      pool: EMPTY_POOL,
      files: [],
      customCategories: [],
      defaultCategories: [],

      filesLoading: false,
      drivesLoading: false,
      quotaRefreshing: false,

      currentCategory: "all",
      searchQuery: "",
      monthlySearchQuery: "",
      filters: {},
      filterPanelOpen: false,
      expandedMonthly: {},

      previewFileId: null,
      shareFileId: null,
      categoryManagerOpen: false,
      confirmDialog: { open: false, title: "", text: "", onConfirm: null },
      progress: { open: false, label: "", sub: "", pct: null },

      // =====================================================
      // AUTH
      // =====================================================
      bootstrapAuth: () => {
        const token = getToken();
        const user = getStoredUser<User>();
        if (token && user) {
          set({ isAuthenticated: true, user });
        } else {
          set({ isAuthenticated: false, user: null });
        }
      },

      login: async (email, password) => {
        set({ authLoading: true });
        try {
          const res = await authApi.login({ email: email.trim(), password });
          setToken(res.access_token);
          setStoredUser(res.user);
          set({ isAuthenticated: true, user: res.user, authLoading: false });
          toast(`Selamat datang, ${res.user.username}!`, "success");
        } catch (e) {
          set({ authLoading: false });
          const msg = e instanceof ApiError ? e.detail : "Login gagal";
          toast(msg, "error");
          throw e;
        }
      },

      register: async (email, username, password) => {
        set({ authLoading: true });
        try {
          const res = await authApi.register({
            email: email.trim(),
            username: username.trim(),
            password,
          });
          setToken(res.access_token);
          setStoredUser(res.user);
          set({ isAuthenticated: true, user: res.user, authLoading: false });
          toast(
            `Akun berhasil dibuat. Selamat datang, ${res.user.username}!`,
            "success",
          );
        } catch (e) {
          set({ authLoading: false });
          const msg = e instanceof ApiError ? e.detail : "Registrasi gagal";
          toast(msg, "error");
          throw e;
        }
      },

      logout: () => {
        clearToken();
        set({
          isAuthenticated: false,
          user: null,
          currentView: "arsip",
          role: "pegawai",
          previewFileId: null,
          shareFileId: null,
          files: [],
          drives: [],
          pool: EMPTY_POOL,
          customCategories: [],
          defaultCategories: [],
        });
        toast("Logout berhasil", "info");
      },

      // =====================================================
      // VIEWS
      // =====================================================
      setView: (v) => {
        set({ currentView: v, sidebarOpen: false });
        if (v === "arsip" || v === "ringkasan") {
          const { filters, currentCategory, searchQuery } = get();
          get().fetchFiles({
            category: currentCategory !== "all" ? currentCategory : undefined,
            search: searchQuery || undefined,
            ...filters,
          });
        }
        if (v === "penyimpanan") get().fetchDrives();
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setRole: (r) => {
        // Pindah ke halaman utama peran yang dipilih
        set({ role: r, currentView: r === "admin" ? "ringkasan" : "arsip" });
      },

      setArsipTab: (t) => set({ arsipTab: t }),

      // =====================================================
      // DATA FETCH
      // =====================================================
      fetchFiles: async (params) => {
        set({ filesLoading: true });
        try {
          const files = await filesApi.listFiles(params || {});
          set({ files: files as FileItem[], filesLoading: false });
        } catch (e) {
          set({ filesLoading: false });
          const msg = e instanceof ApiError ? e.detail : "Gagal memuat file";
          toast(msg, "error");
        }
      },

      fetchDrives: async () => {
        set({ drivesLoading: true });
        try {
          const [drives, pool] = await Promise.all([
            drivesApi.listDrives(),
            drivesApi.getPoolSummary().catch(() => EMPTY_POOL),
          ]);
          set({
            drives: drives as DriveAccount[],
            pool: pool as PoolInfo,
            drivesLoading: false,
          });
        } catch (e) {
          set({ drivesLoading: false });
          const msg = e instanceof ApiError ? e.detail : "Gagal memuat drive";
          toast(msg, "error");
        }
      },

      fetchCategories: async () => {
        try {
          const res = await catApi.listCategories();
          set({
            defaultCategories: res.default.map((c) => ({
              ...c,
              is_builtin: true,
            })),
            customCategories: res.custom.map((c) => ({
              ...c,
              is_builtin: false,
              keywords: c.keywords || [],
            })),
          });
        } catch (e) {
          const msg =
            e instanceof ApiError ? e.detail : "Gagal memuat kategori";
          toast(msg, "error");
        }
      },

      refreshPool: async () => {
        try {
          const pool = await drivesApi.getPoolSummary();
          set({ pool: pool as PoolInfo });
        } catch {
          // silent
        }
      },

      // =====================================================
      // REFRESH QUOTA (BARU) — force refresh dari Google
      // =====================================================
      refreshQuota: async () => {
        if (get().quotaRefreshing) return; // prevent double trigger
        set({ quotaRefreshing: true });
        try {
          await drivesApi.forceRefreshQuota();
          // Refresh data drives + pool setelah refresh quota
          await get().fetchDrives();
          toast("Quota berhasil di-refresh", "success");
        } catch (e) {
          const msg =
            e instanceof ApiError ? e.detail : "Gagal refresh quota";
          toast(msg, "error");
        } finally {
          set({ quotaRefreshing: false });
        }
      },

      removeDrive: async (id) => {
        try {
          await drivesApi.disconnectDrive(id);
          toast("Akun Drive dihapus", "success");
          await get().fetchDrives();
        } catch (e) {
          const msg = e instanceof ApiError ? e.detail : "Gagal hapus drive";
          toast(msg, "error");
          throw e;
        }
      },

      // =====================================================
      // FILES
      // =====================================================
      uploadFiles: async (fileList) => {
        if (fileList.length === 0) return;

        const total = fileList.length;
        let done = 0;

        set({
          progress: {
            open: true,
            label: `Mengunggah 0/${total}`,
            sub: "Menyiapkan…",
            pct: 0,
          },
        });

        for (const file of fileList) {
          try {
            await filesApi.uploadFile(file, undefined, (pct) => {
              const overall = Math.round(
                ((done + pct / 100) / total) * 100,
              );
              set({
                progress: {
                  open: true,
                  label: `Mengunggah ${done + 1}/${total}`,
                  sub: file.name,
                  pct: overall,
                },
              });
            });
            done++;
            toast(`"${file.name}" berhasil diunggah`, "success");
          } catch (e) {
            const msg = e instanceof ApiError ? e.detail : "Upload gagal";
            toast(`Gagal upload "${file.name}": ${msg}`, "error");
          }
        }

        set({ progress: { open: false, label: "", sub: "", pct: null } });

        // refresh list + pool
        const { filters, currentCategory, searchQuery } = get();
        await get().fetchFiles({
          category: currentCategory !== "all" ? currentCategory : undefined,
          search: searchQuery || undefined,
          ...filters,
        });
        get().refreshPool();
      },

      deleteFile: async (id) => {
        try {
          await filesApi.deleteFile(id);
          set((s) => ({ files: s.files.filter((f) => f.id !== id) }));
          toast("File dihapus", "success");
          get().refreshPool();
        } catch (e) {
          const msg = e instanceof ApiError ? e.detail : "Gagal hapus file";
          toast(msg, "error");
        }
      },

      updateFileCategory: async (id, category) => {
        try {
          const res = await filesApi.updateCategory(id, category);
          set((s) => ({
            files: s.files.map((f) =>
              f.id === id ? { ...f, ...res.file } : f,
            ),
          }));
          toast("Kategori diperbarui", "success");
        } catch (e) {
          const msg =
            e instanceof ApiError ? e.detail : "Gagal update kategori";
          toast(msg, "error");
        }
      },

      // =====================================================
      // FILTERS
      // =====================================================
      setCategory: (cat) => {
        set({ currentCategory: cat });
        const { filters, searchQuery } = get();
        get().fetchFiles({
          category: cat !== "all" ? cat : undefined,
          search: searchQuery || undefined,
          ...filters,
        });
      },

      setSearch: (q) => {
        set({ searchQuery: q });
        const { filters, currentCategory } = get();
        get().fetchFiles({
          category: currentCategory !== "all" ? currentCategory : undefined,
          search: q || undefined,
          ...filters,
        });
      },

      setMonthlySearch: (q) => set({ monthlySearchQuery: q }),

      setFilters: (f) => {
        set({ filters: f });
        const { currentCategory, searchQuery } = get();
        get().fetchFiles({
          category: currentCategory !== "all" ? currentCategory : undefined,
          search: searchQuery || undefined,
          ...f,
        });
      },

      resetFilters: () => {
        set({ filters: {} });
        const { currentCategory, searchQuery } = get();
        get().fetchFiles({
          category: currentCategory !== "all" ? currentCategory : undefined,
          search: searchQuery || undefined,
        });
      },

      setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),

      // =====================================================
      // MONTHLY
      // =====================================================
      toggleMonthly: (key) =>
        set((s) => ({
          expandedMonthly: {
            ...s.expandedMonthly,
            [key]: !s.expandedMonthly[key],
          },
        })),

      collapseAllMonthly: () => set({ expandedMonthly: {} }),

      expandAllMonthly: () => {
        const grouped = groupByFolder(get().files);
        const out: Record<string, boolean> = {};
        Object.keys(grouped).forEach((k) => (out[k] = true));
        set({ expandedMonthly: out });
      },

      // =====================================================
      // MODALS
      // =====================================================
      openPreview: (id) => set({ previewFileId: id }),
      closePreview: () => set({ previewFileId: null }),
      openShare: (id) => set({ shareFileId: id }),
      closeShare: () => set({ shareFileId: null }),

      createShare: async (cfg) => {
        const id = get().shareFileId;
        if (!id) return;
        try {
          const res = await shareApi.createShare({
            file_id: id,
            expires_hours: cfg.expires_hours,
            password: cfg.password,
          });
          set((s) => ({
            files: s.files.map((f) =>
              f.id === id
                ? {
                    ...f,
                    is_public: true,
                    share_token: res.token,
                    share_expires_at: res.expires_at,
                  }
                : f,
            ),
          }));
          toast("Link share dibuat", "success");
        } catch (e) {
          const msg = e instanceof ApiError ? e.detail : "Gagal buat share";
          toast(msg, "error");
          throw e;
        }
      },

      revokeShare: async (id) => {
        try {
          await shareApi.revokeShare(id);
          set((s) => ({
            files: s.files.map((f) =>
              f.id === id
                ? { ...f, is_public: false, share_token: null, share_views: 0 }
                : f,
            ),
          }));
          toast("Share dicabut", "success");
        } catch (e) {
          const msg = e instanceof ApiError ? e.detail : "Gagal cabut share";
          toast(msg, "error");
        }
      },

      // =====================================================
      // CATEGORIES
      // =====================================================
      setCategoryManagerOpen: (open) => set({ categoryManagerOpen: open }),

      addCustomCategory: async (name, icon, keywords) => {
        try {
          await catApi.createCategory({ name, icon, keywords });
          toast(`Kategori "${name}" ditambahkan`, "success");
          await get().fetchCategories();
        } catch (e) {
          const msg =
            e instanceof ApiError ? e.detail : "Gagal tambah kategori";
          toast(msg, "error");
          throw e;
        }
      },

      removeCustomCategory: async (id) => {
        try {
          await catApi.deleteCategory(id);
          toast("Kategori dihapus", "success");
          await get().fetchCategories();
        } catch (e) {
          const msg =
            e instanceof ApiError ? e.detail : "Gagal hapus kategori";
          toast(msg, "error");
        }
      },

      // =====================================================
      // UI
      // =====================================================
      showConfirm: (title, text, onConfirm) =>
        set({ confirmDialog: { open: true, title, text, onConfirm } }),

      closeConfirm: () =>
        set((s) => ({
          confirmDialog: {
            ...s.confirmDialog,
            open: false,
            onConfirm: null,
          },
        })),

      showProgress: (label, sub, pct = null) =>
        set({ progress: { open: true, label, sub, pct } }),

      hideProgress: () =>
        set((s) => ({ progress: { ...s.progress, open: false } })),
    }),
    {
      name: "yudit-cloud-store",
      partialize: (s) => ({
        currentView: s.currentView,
        role: s.role,
        filters: s.filters,
        expandedMonthly: s.expandedMonthly,
      }),
    },
  ),
);

// =====================================================
// HELPERS
// =====================================================
export function groupByFolder(
  files: FileItem[],
): Record<string, FileItem[]> {
  const grouped: Record<string, FileItem[]> = {};
  for (const f of files) {
    const key = f.folder_name || "Tanpa Folder";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }
  return grouped;
}

export function categoryCounts(
  files: FileItem[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of files) {
    if (f.category) out[f.category] = (out[f.category] || 0) + 1;
  }
  return out;
}

export function availableYears(files: FileItem[]): string[] {
  const set = new Set<string>();
  files.forEach((f) => set.add(String(f.year)));
  return Array.from(set).sort((a, b) => Number(b) - Number(a));
}

// =====================================================
// GLOBAL EVENT LISTENER — unauthorized → logout
// =====================================================
if (typeof window !== "undefined") {
  window.addEventListener("yudit:unauthorized", () => {
    useYudit.getState().logout();
  });
}