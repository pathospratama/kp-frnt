// src/lib/yudit/store.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  DriveAccount,
  FileItem,
  Filters,
  PoolInfo,
  User,
  ViewKey,
  ConversionJob,
  ConversionOperation,
  ConversionOperationInfo,
  ConversionResult,
  Collaborator,
  EditorMode,
} from "./types";
import * as authApi from "@/lib/api/auth";
import * as filesApi from "@/lib/api/files";
import * as drivesApi from "@/lib/api/drives";
import * as catApi from "@/lib/api/categories";
import * as shareApi from "@/lib/api/share";
import * as convApi from "@/lib/api/conversions";
import * as collabApi from "@/lib/api/collaborators";
import {
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  ApiError,
} from "@/lib/api/client";

// ⭐ NEW — import folder API
import {
  listFolders,
  listFilesInFolder,
  deleteFolder as deleteFolderApi,
  type FolderItem,
  type BreadcrumbItem,
} from "@/lib/api/folders";

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
// UNSUPPORTED OP
// =====================================================
interface UnsupportedOp {
  key: string;
  reason: string;
}

// =====================================================
// ROLE HELPERS
// =====================================================
export function isOwner(user: User | null): boolean {
  return user?.role === "owner";
}

export function isSuperAdmin(user: User | null): boolean {
  return user?.role === "super_admin";
}

export function isMember(user: User | null): boolean {
  return user?.role === "member";
}

export function canManageWorkspace(user: User | null): boolean {
  return isOwner(user) || isSuperAdmin(user);
}

export function defaultViewForRole(user: User | null): ViewKey {
  return isMember(user) ? "my-tasks" : "files";
}

// =====================================================
// CAN ACCESS VIEW — semua role bisa akses semua view
// (member = read-only untuk view tertentu, dikontrol via UI)
// =====================================================
export function canAccessView(user: User | null, view: ViewKey): boolean {
  if (!user) return false;

  // Menu khusus member
  if (view === "my-tasks") return isMember(user);

  // Profile, drives, collaborators, files, dll — semua role boleh
  return true;
}

// =====================================================
// STATE INTERFACE
// =====================================================
interface YuditState {
  isAuthenticated: boolean;
  user: User | null;
  authLoading: boolean;

  currentView: ViewKey;
  sidebarOpen: boolean;

  drives: DriveAccount[];
  pool: PoolInfo;
  files: FileItem[];
  customCategories: catApi.ApiCategory[];
  defaultCategories: catApi.ApiCategory[];
  collaborators: Collaborator[];

  // ⭐ NEW — Folder state
  currentFolderId: string | null;
  folders: FolderItem[];
  folderBreadcrumb: BreadcrumbItem[];
  foldersLoading: boolean;

  conversionOperations: ConversionOperationInfo[];
  conversionUnsupportedOps: UnsupportedOp[];
  conversionJobs: ConversionJob[];
  converting: boolean;

  filesLoading: boolean;
  drivesLoading: boolean;
  quotaRefreshing: boolean;
  collaboratorsLoading: boolean;

  currentCategory: string;
  searchQuery: string;
  monthlySearchQuery: string;
  filters: Filters;
  filterPanelOpen: boolean;
  expandedMonthly: Record<string, boolean>;

  previewFileId: string | null;
  shareFileId: string | null;
  categoryManagerOpen: boolean;
  assignModalOpen: boolean;
  assignModalFileId: string | null;
  editorState: { fileId: string; mode: EditorMode } | null;
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

  driveAuthError: {
    email: string | null;
    message: string | null;
    lastAt: number | null;
  };

  // ============ ACTIONS ============
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  bootstrapAuth: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;

  setView: (v: ViewKey) => void;
  setSidebarOpen: (open: boolean) => void;

  fetchFiles: (params?: filesApi.FileListParams) => Promise<void>;
  fetchDrives: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchCollaborators: () => Promise<void>;

  // ⭐ NEW — Folder actions
  fetchFolders: (parentId?: string | null) => Promise<void>;
  setCurrentFolderId: (folderId: string | null) => Promise<void>;
  refreshFolderFiles: () => Promise<void>;
  deleteFolderAction: (folderId: string) => Promise<void>;

  fetchConversionOperations: () => Promise<void>;
  fetchConversionJobs: () => Promise<void>;
  runConversion: (
    operation: ConversionOperation,
    fileIds: string[],
    params?: Record<string, unknown>,
  ) => Promise<ConversionResult | null>;

  refreshPool: () => Promise<void>;
  refreshQuota: () => Promise<void>;
  removeDrive: (id: string) => Promise<void>;

  // ⭐ UBAH signature: uploadFiles sekarang terima folderId
  uploadFiles: (files: File[], folderId?: string | null) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  updateFileCategory: (id: string, category: string) => Promise<void>;

  setCategory: (cat: string) => void;
  setSearch: (q: string) => void;
  setMonthlySearch: (q: string) => void;
  setFilters: (f: Filters) => void;
  resetFilters: () => void;
  setFilterPanelOpen: (open: boolean) => void;

  toggleMonthly: (key: string) => void;
  collapseAllMonthly: () => void;
  expandAllMonthly: () => void;

  openPreview: (id: string) => void;
  closePreview: () => void;
  openShare: (id: string) => void;
  closeShare: () => void;
  createShare: (cfg: {
    expires_hours: number | null;
    password: string | null;
  }) => Promise<void>;
  revokeShare: (id: string) => Promise<void>;

  setCategoryManagerOpen: (open: boolean) => void;
  addCustomCategory: (
    name: string,
    icon: string,
    keywords: string[],
  ) => Promise<void>;
  removeCustomCategory: (id: string) => Promise<void>;

  openAssignModal: (fileId: string) => void;
  closeAssignModal: () => void;

  openEditor: (fileId: string, mode?: EditorMode) => void;
  closeEditor: () => void;

  showConfirm: (title: string, text: string, onConfirm: () => void) => void;
  closeConfirm: () => void;
  showProgress: (label: string, sub: string, pct?: number | null) => void;
  hideProgress: () => void;

  setDriveAuthError: (email: string | null, message: string | null) => void;
  clearDriveAuthError: () => void;
}

const EMPTY_POOL: PoolInfo = { total: 0, used: 0, free: 0, accounts: 0 };

// =====================================================
// STORE
// =====================================================
export const useYudit = create<YuditState>()(
  persist(
    (set, get) => ({
      // =====================================================
      // INITIAL STATE
      // =====================================================
      isAuthenticated: false,
      user: null,
      authLoading: false,

      currentView: "files",
      sidebarOpen: false,

      drives: [],
      pool: EMPTY_POOL,
      files: [],
      customCategories: [],
      defaultCategories: [],
      collaborators: [],

      // ⭐ NEW — Folder initial state
      currentFolderId: null,
      folders: [],
      folderBreadcrumb: [],
      foldersLoading: false,

      conversionOperations: [],
      conversionUnsupportedOps: [],
      conversionJobs: [],
      converting: false,

      filesLoading: false,
      drivesLoading: false,
      quotaRefreshing: false,
      collaboratorsLoading: false,

      currentCategory: "all",
      searchQuery: "",
      monthlySearchQuery: "",
      filters: {},
      filterPanelOpen: false,
      expandedMonthly: {},

      previewFileId: null,
      shareFileId: null,
      categoryManagerOpen: false,
      assignModalOpen: false,
      assignModalFileId: null,
      editorState: null,
      confirmDialog: { open: false, title: "", text: "", onConfirm: null },
      progress: { open: false, label: "", sub: "", pct: null },

      driveAuthError: { email: null, message: null, lastAt: null },

      // =====================================================
      // AUTH
      // =====================================================
      bootstrapAuth: () => {
        const token = getToken();
        const user = getStoredUser<User>();
        if (!token || !user) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        if (!user.role) {
          clearToken();
          setStoredUser({ isAuthenticated: false, user: null });
          toast("Data user tidak valid. Silakan login ulang.", "info");
          return;
        }

        const targetView = defaultViewForRole(user);
        set({
          isAuthenticated: true,
          user,
          currentView: canAccessView(user, get().currentView)
            ? get().currentView
            : targetView,
        });
      },

      login: async (email, password) => {
        set({ authLoading: true });
        try {
          const res = await authApi.login({ email, password });

          const role = res.user.role;
          if (role !== "owner" && role !== "super_admin" && role !== "member") {
            throw new Error("Server mengembalikan role tidak valid");
          }

          const user: User = {
            id: res.user.id,
            email: res.user.email,
            username: res.user.username,
            role,
            owner_id: res.user.owner_id ?? null,
            must_change_password: res.user.must_change_password ?? false,
          };

          setToken(res.access_token);
          setStoredUser(user);

          set({
            isAuthenticated: true,
            user,
            authLoading: false,
            currentView: defaultViewForRole(user),
            driveAuthError: { email: null, message: null, lastAt: null },
          });

          toast(`Selamat datang, ${user.username}!`, "success");

          if (user.must_change_password) {
            toast(
              "Anda masih memakai password default. Segera ganti password!",
              "error",
            );
          }
        } catch (e) {
          set({ authLoading: false });

          if (e instanceof ApiError) {
            if (e.status === 429) {
              const wait = e.retryAfter
                ? `Coba lagi dalam ${e.retryAfter} detik.`
                : "Coba lagi beberapa saat lagi.";
              toast(`Terlalu banyak percobaan login. ${wait}`, "error");
              throw e;
            }
            if (e.status === 401) {
              toast("Email atau password salah", "error");
              throw e;
            }
            if (e.status === 403 && e.detail.includes("dinonaktifkan")) {
              toast("Akun dinonaktifkan. Hubungi owner workspace.", "error");
              throw e;
            }
            if (e.status >= 500) {
              const rid = e.requestId ? ` (ref: ${e.requestId})` : "";
              toast(`Server error. Coba lagi.${rid}`, "error");
              throw e;
            }
            toast(e.detail, "error");
            throw e;
          }

          toast("Login gagal", "error");
          throw e;
        }
      },

      register: async (email, username, password) => {
        set({ authLoading: true });
        try {
          const res = await authApi.register({ email, username, password });

          const role = res.user.role;
          if (role !== "owner" && role !== "super_admin" && role !== "member") {
            throw new Error("Server mengembalikan role tidak valid");
          }

          const user: User = {
            id: res.user.id,
            email: res.user.email,
            username: res.user.username,
            role,
            owner_id: res.user.owner_id ?? null,
            must_change_password: res.user.must_change_password ?? false,
          };

          setToken(res.access_token);
          setStoredUser(user);

          set({
            isAuthenticated: true,
            user,
            authLoading: false,
            currentView: defaultViewForRole(user),
            driveAuthError: { email: null, message: null, lastAt: null },
          });
          toast(
            `Akun berhasil dibuat. Selamat datang, ${user.username}!`,
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
          currentView: "files",
          previewFileId: null,
          shareFileId: null,
          categoryManagerOpen: false,
          assignModalOpen: false,
          assignModalFileId: null,
          editorState: null,
          files: [],
          drives: [],
          pool: EMPTY_POOL,
          customCategories: [],
          defaultCategories: [],
          collaborators: [],
          conversionOperations: [],
          conversionUnsupportedOps: [],
          conversionJobs: [],
          // ⭐ Reset folder state
          currentFolderId: null,
          folders: [],
          folderBreadcrumb: [],
          driveAuthError: { email: null, message: null, lastAt: null },
        });
        toast("Logout berhasil", "info");
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          await authApi.changePassword(currentPassword, newPassword);

          const currentUser = get().user;
          if (currentUser) {
            const updated: User = {
              ...currentUser,
              must_change_password: false,
            };
            set({ user: updated });
            setStoredUser(updated);
          }
          toast("Password berhasil diubah", "success");
        } catch (e) {
          const msg =
            e instanceof ApiError ? e.detail : "Gagal ganti password";
          toast(msg, "error");
          throw e;
        }
      },

      // =====================================================
      // VIEWS
      // =====================================================
      setView: (v) => {
        const user = get().user;

        if (!canAccessView(user, v)) {
          toast("Anda tidak punya akses ke halaman ini.", "error");
          set({ currentView: defaultViewForRole(user), sidebarOpen: false });
          return;
        }

        // ⭐ Reset folder state saat pindah view
        set({
          currentView: v,
          sidebarOpen: false,
          ...(v !== "files"
            ? {
                currentFolderId: null,
                folders: [],
                folderBreadcrumb: [],
              }
            : {}),
        });
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // =====================================================
      // DATA FETCH — accessible untuk semua role
      // =====================================================
      fetchFiles: async (params) => {
        set({ filesLoading: true });
        try {
          const files = await filesApi.listFiles(params || {});
          set({ files: files as FileItem[], filesLoading: false });
        } catch (e) {
          set({ filesLoading: false });
          if (e instanceof ApiError && e.status === 401) return;
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

          const currentErr = get().driveAuthError;
          let nextErr = currentErr;
          if (currentErr.email) {
            const target = (drives as DriveAccount[]).find(
              (d) => d.google_email === currentErr.email,
            );
            if (!target || target.is_active) {
              nextErr = { email: null, message: null, lastAt: null };
            }
          }

          set({
            drives: drives as DriveAccount[],
            pool: pool as PoolInfo,
            drivesLoading: false,
            driveAuthError: nextErr,
          });
        } catch (e) {
          set({ drivesLoading: false });
          if (e instanceof ApiError && e.status === 401) return;
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
          if (e instanceof ApiError && e.status === 401) return;
          const msg =
            e instanceof ApiError ? e.detail : "Gagal memuat kategori";
          toast(msg, "error");
        }
      },

      fetchCollaborators: async () => {
        set({ collaboratorsLoading: true });
        try {
          const res = await collabApi.listCollaborators();
          set({ collaborators: res, collaboratorsLoading: false });
        } catch (e) {
          set({ collaboratorsLoading: false });
          if (e instanceof ApiError && e.status === 401) return;
          const msg =
            e instanceof ApiError ? e.detail : "Gagal memuat collaborators";
          toast(msg, "error");
        }
      },

      // =====================================================
      // ⭐ FOLDER ACTIONS
      // =====================================================
      fetchFolders: async (parentId) => {
        set({ foldersLoading: true });
        try {
          const targetParent =
            parentId !== undefined ? parentId : get().currentFolderId;
          const folders = await listFolders(targetParent ?? null);
          set({ folders, foldersLoading: false });
        } catch (e) {
          set({ foldersLoading: false });
          if (e instanceof ApiError && e.status === 401) return;
          const msg = e instanceof ApiError ? e.detail : "Gagal memuat folder";
          toast(msg, "error");
        }
      },

      setCurrentFolderId: async (folderId) => {
        set({
          currentFolderId: folderId,
          // Reset filter/search saat masuk folder agar tidak bingung
          searchQuery: "",
          currentCategory: "all",
          filters: {},
        });

        // Load file & breadcrumb
        if (folderId) {
          try {
            const res = await listFilesInFolder(folderId);
            set({
              files: res.files as FileItem[],
              folderBreadcrumb: res.breadcrumb,
            });
          } catch (e) {
            const msg = e instanceof ApiError ? e.detail : "Gagal memuat folder";
            toast(msg, "error");
            // Fallback: balik ke root
            set({ currentFolderId: null, folderBreadcrumb: [] });
            await get().fetchFiles();
            return;
          }
        } else {
          set({ folderBreadcrumb: [] });
          await get().fetchFiles();
        }

        // Load subfolder di dalam folder ini
        await get().fetchFolders(folderId);
      },

      refreshFolderFiles: async () => {
        const fid = get().currentFolderId;
        if (fid) {
          try {
            const res = await listFilesInFolder(fid);
            set({
              files: res.files as FileItem[],
              folderBreadcrumb: res.breadcrumb,
            });
          } catch (e) {
            if (e instanceof ApiError && e.status === 401) return;
            const msg =
              e instanceof ApiError ? e.detail : "Gagal refresh file";
            toast(msg, "error");
          }
        } else {
          await get().fetchFiles();
        }
        await get().fetchFolders(fid);
      },

      deleteFolderAction: async (folderId) => {
        if (!canManageWorkspace(get().user)) {
          toast("Hanya owner atau super admin yang bisa hapus folder", "error");
          return;
        }
        try {
          await deleteFolderApi(folderId);
          toast("Folder dihapus", "success");
          // Kalau folder yang dihapus = current folder → balik ke root
          if (get().currentFolderId === folderId) {
            await get().setCurrentFolderId(null);
          } else {
            await get().fetchFolders(get().currentFolderId);
          }
        } catch (e) {
          const msg =
            e instanceof ApiError ? e.detail : "Gagal menghapus folder";
          toast(msg, "error");
        }
      },

      // =====================================================
      // CONVERSION
      // =====================================================
      fetchConversionOperations: async () => {
        try {
          const res = await convApi.listOperations();
          set({
            conversionOperations: Array.isArray(res.operations)
              ? res.operations
              : [],
            conversionUnsupportedOps: Array.isArray(res.unsupported)
              ? res.unsupported
              : [],
          });
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) return;
          const msg =
            e instanceof ApiError ? e.detail : "Gagal memuat operasi konversi";
          toast(msg, "error");
        }
      },

      fetchConversionJobs: async () => {
        try {
          const jobs = await convApi.listJobs(50);
          set({ conversionJobs: jobs });
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) return;
          const msg =
            e instanceof ApiError ? e.detail : "Gagal memuat riwayat konversi";
          toast(msg, "error");
        }
      },

      runConversion: async (operation, fileIds, params = {}) => {
        if (get().converting) return null;
        set({ converting: true });
        set({
          progress: {
            open: true,
            label: "Mengonversi…",
            sub: `${fileIds.length} file • ${operation}`,
            pct: null,
          },
        });
        try {
          const result = await convApi.runConversion({
            operation,
            file_ids: fileIds,
            params,
          });
          toast(`Konversi berhasil: ${result.result_file.name}`, "success");
          await get().refreshFolderFiles();
          await get().fetchConversionJobs();
          get().refreshPool();
          return result;
        } catch (e) {
          let msg = "Konversi gagal";
          if (e instanceof ApiError) {
            if (e.isDriveError) {
              const email = e.driveEmail || "Google Drive";
              msg =
                `${email} perlu di-reconnect. ` +
                `Buka menu 'Google Drive' → hapus akun lama → connect ulang.`;
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("yudit:drive-auth-error", {
                    detail: {
                      email: e.driveEmail,
                      driveId: e.driveId,
                      message: e.detail,
                    },
                  }),
                );
              }
            } else if (e.status === 401) {
              msg =
                "Refresh token Google Drive sudah tidak valid. " +
                "Buka menu 'Google Drive' → hapus akun lama → connect ulang.";
            } else if (e.status === 402) {
              msg =
                "Kuota iLovePDF habis atau tool premium-only. " +
                "Login developer.ilovepdf.com untuk upgrade plan.";
            } else {
              msg = e.detail;
            }
          }
          toast(msg, "error");
          get().fetchConversionJobs();
          return null;
        } finally {
          set({
            converting: false,
            progress: { open: false, label: "", sub: "", pct: null },
          });
        }
      },

      // =====================================================
      // DRIVES
      // =====================================================
      refreshPool: async () => {
        try {
          const pool = await drivesApi.getPoolSummary();
          set({ pool: pool as PoolInfo });
        } catch {
          // silent
        }
      },

      refreshQuota: async () => {
        if (!canManageWorkspace(get().user)) {
          toast("Hanya owner atau super admin yang bisa refresh quota", "error");
          return;
        }
        if (get().quotaRefreshing) return;
        set({ quotaRefreshing: true });
        try {
          await drivesApi.forceRefreshQuota();
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
        if (!canManageWorkspace(get().user)) {
          toast("Hanya owner atau super admin yang bisa hapus drive", "error");
          throw new Error("Forbidden");
        }
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
      // FILES — ⭐ uploadFiles sekarang terima folderId
      // =====================================================
      uploadFiles: async (fileList, folderId) => {
        if (fileList.length === 0) return;

        const total = fileList.length;
        let done = 0;

        // ⭐ Pakai folderId yang diberikan, atau currentFolderId
        const targetFolderId =
          folderId !== undefined ? folderId : get().currentFolderId;

        set({
          progress: {
            open: true,
            label: `Mengunggah 0/${total}`,
            sub: targetFolderId
              ? "Uploading ke folder aktif…"
              : "Menyiapkan…",
            pct: 0,
          },
        });

        for (const file of fileList) {
          try {
            await filesApi.uploadFile(file, targetFolderId, (pct) => {
              const overall = Math.round(((done + pct / 100) / total) * 100);
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

        // ⭐ Refresh folder context (kalau di dalam folder) atau root files
        await get().refreshFolderFiles();
        get().refreshPool();
      },

      deleteFile: async (id) => {
        try {
          await filesApi.deleteFile(id);
          set((s) => ({ files: s.files.filter((f) => f.id !== id) }));
          toast("File dihapus", "success");
          get().refreshPool();
          // ⭐ Refresh folder counts kalau sedang di dalam folder
          if (get().currentFolderId) {
            await get().fetchFolders(get().currentFolderId);
          }
        } catch (e) {
          if (e instanceof ApiError && e.isDriveError) {
            const email = e.driveEmail || "Google Drive";
            toast(
              `${email} perlu di-reconnect. Buka menu "Google Drive".`,
              "error",
            );
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("yudit:drive-auth-error", {
                  detail: {
                    email: e.driveEmail,
                    driveId: e.driveId,
                    message: e.detail,
                  },
                }),
              );
            }
            return;
          }
          const msg = e instanceof ApiError ? e.detail : "Gagal hapus file";
          toast(msg, "error");
        }
      },

      updateFileCategory: async (id, category) => {
        if (!canManageWorkspace(get().user)) {
          toast("Hanya owner atau super admin yang bisa ubah kategori", "error");
          return;
        }
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
      // FILTERS — ⭐ Sesuaikan dengan folder context
      // =====================================================
      setCategory: (cat) => {
        set({ currentCategory: cat });
        // ⭐ Hanya fetch dari API kalau TIDAK di dalam folder
        // (file di folder sudah ter-load semua & difilter di UI)
        if (get().currentFolderId) return;

        const { filters, searchQuery } = get();
        get().fetchFiles({
          category: cat !== "all" ? cat : undefined,
          search: searchQuery || undefined,
          ...filters,
        });
      },

      setSearch: (q) => {
        set({ searchQuery: q });
        // ⭐ Hanya fetch dari API kalau TIDAK di dalam folder
        if (get().currentFolderId) return;

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
        // ⭐ Hanya fetch dari API kalau TIDAK di dalam folder
        if (get().currentFolderId) return;

        const { currentCategory, searchQuery } = get();
        get().fetchFiles({
          category: currentCategory !== "all" ? currentCategory : undefined,
          search: searchQuery || undefined,
          ...f,
        });
      },

      resetFilters: () => {
        set({ filters: {} });
        if (get().currentFolderId) return;

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
          if (e instanceof ApiError && e.status === 403) {
            get().closeShare();
            toast(
              e.detail ||
                "Anda tidak punya izin share file ini. " +
                  "Minta owner menambahkan permission share.",
              "error",
            );
            throw e;
          }
          if (e instanceof ApiError && e.status === 410) {
            get().closeShare();
            toast(
              "File ini terkait Google Drive yang sudah dihapus. " +
                "Reconnect akun Google Drive untuk mengakses kembali.",
              "error",
            );
            throw e;
          }
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
      // ASSIGN
      // =====================================================
      openAssignModal: (fileId) => {
        if (!canManageWorkspace(get().user)) {
          toast("Hanya owner atau super admin yang bisa assign", "error");
          return;
        }
        set({ assignModalOpen: true, assignModalFileId: fileId });
      },

      closeAssignModal: () =>
        set({ assignModalOpen: false, assignModalFileId: null }),

      // =====================================================
      // EDITOR
      // =====================================================
      openEditor: (fileId, mode = "local") =>
        set({ editorState: { fileId, mode } }),

      closeEditor: () => set({ editorState: null }),

      // =====================================================
      // CATEGORIES
      // =====================================================
      setCategoryManagerOpen: (open) => {
        if (open && !canManageWorkspace(get().user)) {
          toast(
            "Hanya owner atau super admin yang bisa kelola kategori",
            "error",
          );
          return;
        }
        set({ categoryManagerOpen: open });
      },

      addCustomCategory: async (name, icon, keywords) => {
        if (!canManageWorkspace(get().user)) {
          toast("Akses ditolak", "error");
          throw new Error("Forbidden");
        }
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
        if (!canManageWorkspace(get().user)) {
          toast("Akses ditolak", "error");
          return;
        }
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

      // =====================================================
      // DRIVE AUTH ERROR
      // =====================================================
      setDriveAuthError: (email, message) =>
        set({
          driveAuthError: {
            email,
            message,
            lastAt: Date.now(),
          },
        }),

      clearDriveAuthError: () =>
        set({
          driveAuthError: { email: null, message: null, lastAt: null },
        }),
    }),
    {
      name: "yudit-cloud-store",
      partialize: (s) => ({
        currentView: s.currentView,
        filters: s.filters,
        expandedMonthly: s.expandedMonthly,
        // ⭐ Persist currentFolderId? TIDAK — reset setiap reload
        // untuk hindari state stale kalau folder sudah dihapus
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
  files.forEach((f) => {
    if (f.year != null) {
      set.add(String(f.year));
    }
  });
  return Array.from(set).sort((a, b) => Number(b) - Number(a));
}

// =====================================================
// GLOBAL EVENT LISTENERS
// =====================================================
if (typeof window !== "undefined") {
  window.addEventListener("yudit:unauthorized", () => {
    useYudit.getState().logout();
  });

  window.addEventListener("yudit:drive-auth-error", ((e: Event) => {
    const detail = (e as CustomEvent<{
      email?: string | null;
      driveId?: string | null;
      message?: string | null;
    }>).detail;

    if (!detail) return;

    const email = detail.email || null;
    const message =
      detail.message ||
      "Google Drive perlu di-reconnect. Buka menu Google Drive untuk memperbaiki.";

    useYudit.getState().setDriveAuthError(email, message);

    const state = useYudit.getState();
    if (canManageWorkspace(state.user)) {
      state.fetchDrives().catch(() => {
        /* silent */
      });
    }
  }) as EventListener);
}
