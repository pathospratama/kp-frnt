// src/components/yudit/views/profile-view.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Monitor,
  Bell,
  Palette,
  History,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  Trash2,
  Calendar,
  Clock,
  Globe,
  Sparkles,
  RefreshCw,
  Smartphone,
  Tablet,
  Bot,
  MapPin,
  ChevronDown,
  Compass,
} from "lucide-react";
import { toast } from "sonner";

import { useYudit } from "@/lib/yudit/store";
import {
  getProfile,
  updatePersonalInfo,
  updatePreferences,
  getNotificationPrefs,
  updateNotificationPrefs,
  listSessions,
  revokeSession,
  revokeAllOtherSessions,
  listActivity,
  listPageViews,
  changePasswordFromProfile,
  type UserProfile,
  type NotificationPrefs,
  type Session,
  type ActivityItem,
  type PageView,
} from "@/lib/api/profile";
import { formatDate, formatDateTime } from "@/lib/yudit/utils";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  applyLanguage,
  applyTheme,
  getCurrentTheme,
} from "@/hooks/use-apply-preferences";

// =====================================================
// SECTION TABS
// =====================================================
type SectionKey =
  | "personal"
  | "security"
  | "sessions"
  | "notifications"
  | "preferences"
  | "activity";

const SECTIONS: {
  key: SectionKey;
  label: string;
  icon: typeof User;
  desc: string;
}[] = [
  {
    key: "personal",
    label: "Personal Information",
    icon: User,
    desc: "Identitas dan informasi kepegawaian",
  },
  {
    key: "security",
    label: "Security & Privacy",
    icon: Shield,
    desc: "Password, MFA dan keamanan akun",
  },
  {
    key: "sessions",
    label: "Devices & Sessions",
    icon: Monitor,
    desc: "Perangkat dan sesi login aktif",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    desc: "Pengaturan pemberitahuan",
  },
  {
    key: "preferences",
    label: "Appearance & Preferences",
    icon: Palette,
    desc: "Tema dan tampilan",
  },
  {
    key: "activity",
    label: "Activity History",
    icon: History,
    desc: "Riwayat aktivitas akun",
  },
];

// =====================================================
// MAIN COMPONENT
// =====================================================
export function ProfileView() {
  const user = useYudit((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionKey>("personal");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      const msg = e instanceof ApiError ? e.detail : "Gagal memuat profil";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading || !profile) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 size={28} className="animate-spin text-[var(--y-primary)]" />
      </div>
    );
  }

  const initials = (profile.full_name || profile.username || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="y-anim-fade">
      {/* Header Profile */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 overflow-hidden rounded-3xl border border-[var(--y-border)] bg-[var(--y-bg-elev)]"
      >
        <div
          className="h-24 w-full"
          style={{
            background:
              "linear-gradient(135deg, var(--y-primary) 0%, var(--y-accent) 100%)",
          }}
        />
        <div className="relative px-5 pb-5">
          <div className="-mt-12 mb-3 flex flex-col sm:flex-row sm:items-end sm:gap-4">
            <div className="relative">
              <div
                className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-[var(--y-bg-elev)] text-2xl font-bold text-white shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, var(--y-primary), var(--y-accent))",
                }}
              >
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || profile.username}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <button
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[var(--y-primary)] text-white shadow-md hover:opacity-90"
                title="Ganti foto (segera hadir)"
              >
                <Camera size={13} />
              </button>
            </div>
            <div className="min-w-0 flex-1 sm:pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-[var(--y-text)]">
                  {profile.full_name || profile.username}
                </h1>
                {profile.is_active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(16,185,129,0.15)] px-2 py-0.5 text-[10px] font-bold text-[#10b981]">
                    <CheckCircle2 size={10} />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(239,68,68,0.15)] px-2 py-0.5 text-[10px] font-bold text-[var(--y-danger)]">
                    <AlertCircle size={10} />
                    Inactive
                  </span>
                )}
                {profile.profile_completed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(99,102,241,0.15)] px-2 py-0.5 text-[10px] font-bold text-[var(--y-primary)]">
                    <Sparkles size={10} />
                    Verified
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-[var(--y-text-dim)]">
                <span className="font-semibold text-[var(--y-primary)]">
                  {profile.role === "owner"
                    ? "Owner"
                    : profile.role === "super_admin"
                      ? "Super Admin"
                      : "Member"}
                </span>
                {" · "}
                {profile.job_title || profile.department || "YuditCloud"}
              </p>
              <p className="text-[11px] text-[var(--y-text-mute)]">
                {profile.email} · Bergabung {formatDate(profile.created_at)}
              </p>
            </div>
            <div className="mt-3 flex gap-2 sm:mt-0">
              <button
                onClick={loadProfile}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[12px] font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
              >
                <RefreshCw size={13} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Layout: Sidebar + Content */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Sidebar sections */}
        <div className="space-y-1 rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-2">
          <div className="px-3 py-2">
            <h2 className="text-sm font-bold text-[var(--y-text)]">
              Account Center
            </h2>
            <p className="text-[11px] text-[var(--y-text-mute)]">
              Pengelolaan identitas, keamanan, preferensi dan aktivitas pengguna.
            </p>
          </div>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                activeSection === s.key
                  ? "bg-[rgba(239,68,68,0.08)] text-[var(--y-primary)]"
                  : "text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]",
              )}
            >
              <s.icon size={15} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold">
                  {s.label}
                </div>
                <div className="text-[10px] text-[var(--y-text-mute)]">
                  {s.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === "personal" && (
                <PersonalSection profile={profile} onChange={setProfile} />
              )}
              {activeSection === "security" && (
                <SecuritySection profile={profile} />
              )}
              {activeSection === "sessions" && <SessionsSection />}
              {activeSection === "notifications" && <NotificationsSection />}
              {activeSection === "preferences" && (
                <PreferencesSection profile={profile} onChange={setProfile} />
              )}
              {activeSection === "activity" && <ActivitySection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PERSONAL SECTION
// =====================================================
function PersonalSection({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
}) {
  const [form, setForm] = useState({
    full_name: profile.full_name || "",
    phone_number: profile.phone_number || "",
    gender: profile.gender || "",
    address: profile.address || "",
    date_of_birth: profile.date_of_birth || "",
    bio: profile.bio || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updatePersonalInfo({
        full_name: form.full_name || null,
        phone_number: form.phone_number || null,
        gender: (form.gender as any) || null,
        address: form.address || null,
        date_of_birth: form.date_of_birth || null,
        bio: form.bio || null,
      });
      onChange(updated);
      toast.success("Informasi personal diperbarui");
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Personal Information"
        desc="Identitas dan informasi kepegawaian Anda"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ReadOnlyField label="User ID" value={profile.id} mono />
        <ReadOnlyField label="Username" value={profile.username} mono />
        <ReadOnlyField label="Email" value={profile.email} />
        <ReadOnlyField
          label="Tanggal Bergabung"
          value={formatDate(profile.created_at)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nama Lengkap" required>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Nama lengkap sesuai identitas"
            className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm"
          />
        </FormField>
        <FormField label="Nomor Telepon">
          <input
            type="tel"
            value={form.phone_number}
            onChange={(e) =>
              setForm({ ...form, phone_number: e.target.value })
            }
            placeholder="+62 xxx xxxx xxxx"
            className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm"
          />
        </FormField>
        <FormField label="Jenis Kelamin">
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm"
          >
            <option value="">Tidak disebutkan</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
            <option value="other">Lainnya</option>
            <option value="prefer_not_to_say">Memilih tidak menjawab</option>
          </select>
        </FormField>
        <FormField label="Tanggal Lahir">
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) =>
              setForm({ ...form, date_of_birth: e.target.value })
            }
            className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm"
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Alamat">
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Alamat lengkap"
              className="y-focus w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <FormField label="Bio">
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Deskripsi singkat tentang Anda"
              maxLength={500}
              className="y-focus w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 py-2 text-sm"
            />
          </FormField>
        </div>
      </div>

      <div className="flex justify-end border-t border-[var(--y-border-soft)] pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="y-gradient-brand inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}

// =====================================================
// SECURITY SECTION
// =====================================================
function SecuritySection({ profile }: { profile: UserProfile }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePw = async () => {
    if (newPw.length < 8) return toast.error("Password minimal 8 karakter");
    if (newPw !== confirmPw) return toast.error("Konfirmasi tidak cocok");
    if (newPw === currentPw) return toast.error("Password baru harus berbeda");

    setSaving(true);
    try {
      await changePasswordFromProfile(currentPw, newPw);
      toast.success("Password berhasil diubah");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Gagal mengganti password";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Security & Privacy"
        desc="Password, MFA dan keamanan akun"
      />

      <div className="rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--y-text)]">
              Ubah Password
            </h3>
            <p className="text-[11px] text-[var(--y-text-mute)]">
              Terakhir diubah:{" "}
              {profile.last_password_change_at
                ? formatDateTime(profile.last_password_change_at)
                : "Belum pernah"}
            </p>
          </div>
          <button
            onClick={() => setShow(!show)}
            className="text-[11px] font-semibold text-[var(--y-primary)] hover:underline"
          >
            {show ? "Sembunyikan" : "Tampilkan form"}
          </button>
        </div>

        {show && (
          <div className="space-y-3">
            <FormField label="Password Saat Ini">
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm"
              />
            </FormField>
            <FormField label="Password Baru">
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                minLength={8}
                className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm"
              />
            </FormField>
            <FormField label="Konfirmasi Password Baru">
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm"
              />
            </FormField>
            <div className="flex justify-end">
              <button
                onClick={handleChangePw}
                disabled={saving}
                className="y-gradient-brand inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Shield size={13} />
                )}
                Simpan
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--y-text)]">
              Multi-Factor Authentication (MFA)
            </h3>
            <p className="text-[11px] text-[var(--y-text-mute)]">
              {profile.mfa_enabled
                ? "✅ MFA aktif. Akun Anda lebih aman."
                : "Tambah lapisan keamanan dengan MFA (segera hadir)"}
            </p>
          </div>
          <button
            disabled
            className="rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] px-3 py-1.5 text-[11px] font-semibold text-[var(--y-text-mute)] opacity-60"
          >
            {profile.mfa_enabled ? "Nonaktifkan" : "Aktifkan (Coming Soon)"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SESSIONS SECTION
// =====================================================
function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      toast.error("Gagal memuat sesi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      await revokeSession(id);
      toast.success("Sesi dicabut");
      load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Gagal mencabut sesi";
      toast.error(msg);
    }
  };

  const handleRevokeAll = async () => {
    try {
      await revokeAllOtherSessions();
      toast.success("Semua sesi lain dicabut");
      load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Gagal logout";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Devices & Sessions"
        desc="Perangkat dan sesi login aktif dengan detail lengkap"
      />

      <div className="rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)] p-3">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--y-warn)]">
            <AlertCircle size={14} />
            Info: Akurasi Lokasi & Deteksi Perangkat
          </div>
          <ChevronDown
            size={14}
            className={cn(
              "text-[var(--y-warn)] transition-transform",
              showInfo && "rotate-180",
            )}
          />
        </button>
        {showInfo && (
          <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-[var(--y-text-dim)]">
            <p>
              • Lokasi <b>(estimasi)</b> berdasarkan IP address — akurasi
              ±50-200 km untuk mobile carrier (XL, Telkomsel, Indosat sering
              routing via gateway Jakarta).
            </p>
            <p>
              • IP publik bisa berubah saat Anda berpindah WiFi/data seluler.
              Session dengan perangkat sama akan <b>otomatis digabung</b>.
            </p>
            <p>
              • Untuk keamanan optimal, aktifkan <b>2FA</b> (coming soon) —
              jangan hanya andalkan geolokasi.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleRevokeAll}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-3 text-[12px] font-semibold text-[var(--y-danger)] hover:bg-[rgba(239,68,68,0.15)]"
        >
          <LogOut size={13} />
          Logout dari semua perangkat
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 size={22} className="animate-spin text-[var(--y-primary)]" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--y-border)] py-10 text-center text-sm text-[var(--y-text-mute)]">
          Tidak ada sesi aktif
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const Icon = getDeviceIcon(s.device_type);
            return (
              <div
                key={s.id}
                className={cn(
                  "rounded-xl border bg-[var(--y-bg)] p-4",
                  s.is_current
                    ? "border-[var(--y-primary)] ring-2 ring-[rgba(239,68,68,0.1)]"
                    : "border-[var(--y-border)]",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                      s.is_current
                        ? "bg-[rgba(16,185,129,0.15)] text-[#10b981]"
                        : "bg-[var(--y-bg-hover)] text-[var(--y-text-dim)]",
                    )}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-[var(--y-text)]">
                        {s.device_display || s.device_name || "Unknown Device"}
                      </span>
                      {s.is_current && (
                        <span className="rounded-full bg-[rgba(16,185,129,0.15)] px-2 py-0.5 text-[9px] font-bold text-[#10b981]">
                          CURRENT
                        </span>
                      )}
                      {s.device_type && (
                        <span className="rounded-full bg-[var(--y-bg-hover)] px-2 py-0.5 text-[9px] font-semibold uppercase text-[var(--y-text-mute)]">
                          {s.device_type}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-2">
                      {s.device_brand && (
                        <DetailRow label="Brand" value={s.device_brand} />
                      )}
                      {s.device_model && s.device_model !== "Unknown" && (
                        <DetailRow label="Model" value={s.device_model} mono />
                      )}
                      {s.os && (
                        <DetailRow
                          label="OS"
                          value={`${s.os}${s.os_version ? ` ${s.os_version}` : ""}`}
                        />
                      )}
                      {s.browser && (
                        <DetailRow
                          label="Browser"
                          value={`${s.browser}${s.browser_version ? ` ${s.browser_version}` : ""}`}
                        />
                      )}
                      {s.ip_address && (
                        <DetailRow label="IP" value={s.ip_address} mono />
                      )}
                      {s.location && (
                        <div className="flex items-baseline gap-1.5">
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
                            Lokasi:
                          </span>
                          <span
                            className="min-w-0 text-[11px] text-[var(--y-text-dim)]"
                            title="Berdasarkan IP — bisa tidak akurat untuk koneksi mobile/VPN"
                          >
                            {s.location}{" "}
                            <span className="text-[10px] italic text-[var(--y-text-mute)]">
                              (estimasi)
                            </span>
                          </span>
                        </div>
                      )}
                      {s.isp && (
                        <DetailRow label="ISP" value={s.isp} truncate />
                      )}
                      {s.last_page && (
                        <DetailRow
                          label="Halaman Terakhir"
                          value={s.last_page}
                          mono
                        />
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-[var(--y-text-mute)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={10} />
                        Aktif {formatDateTime(s.last_active_at)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={10} />
                        Login {formatDateTime(s.created_at)}
                      </span>
                    </div>
                  </div>

                  {!s.is_current && (
                    <button
                      onClick={() => handleRevoke(s.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--y-text-mute)] hover:bg-[rgba(239,68,68,0.15)] hover:text-[var(--y-danger)]"
                      title="Cabut sesi ini"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================================================
// NOTIFICATIONS SECTION
// =====================================================
function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await getNotificationPrefs();
      setPrefs(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      toast.error("Gagal memuat preferensi notifikasi");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (key: keyof NotificationPrefs) => {
    if (!prefs || key === "updated_at") return;
    setSaving(key);
    try {
      const updated = await updateNotificationPrefs({
        [key]: !prefs[key],
      });
      setPrefs(updated);
      toast.success("Preferensi diperbarui");
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setSaving(null);
    }
  };

  if (!prefs) {
    return (
      <div className="grid place-items-center py-10">
        <Loader2 size={22} className="animate-spin text-[var(--y-primary)]" />
      </div>
    );
  }

  const items: {
    key: keyof NotificationPrefs;
    label: string;
    desc: string;
  }[] = [
    {
      key: "file_uploaded",
      label: "File Diunggah",
      desc: "Notifikasi saat ada file baru diunggah",
    },
    {
      key: "document_assigned",
      label: "Dokumen Ditugaskan",
      desc: "Notifikasi saat dokumen di-assign ke Anda",
    },
    {
      key: "drive_errors",
      label: "Error Google Drive",
      desc: "Notifikasi saat token Drive perlu reconnect",
    },
    {
      key: "monthly_reports",
      label: "Laporan Bulanan",
      desc: "Ringkasan storage & aktivitas setiap bulan",
    },
    {
      key: "collaboration_invites",
      label: "Undangan Kolaborasi",
      desc: "Notifikasi saat diundang ke workspace",
    },
    {
      key: "security_alerts",
      label: "Peringatan Keamanan",
      desc: "Notifikasi login/perubahan password",
    },
    {
      key: "product_updates",
      label: "Update Produk",
      desc: "Info fitur dan pembaruan aplikasi",
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Notifications"
        desc="Atur notifikasi apa yang ingin Anda terima"
      />

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--y-text)]">
                {item.label}
              </div>
              <div className="text-[11px] text-[var(--y-text-mute)]">
                {item.desc}
              </div>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              disabled={saving === item.key}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                prefs[item.key]
                  ? "bg-[var(--y-primary)]"
                  : "bg-[var(--y-bg-elev-2)]",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  prefs[item.key] ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// PREFERENCES SECTION — FINAL FIX
// - Theme langsung apply + auto-save ke DB (tanpa klik simpan)
// - Bahasa hardcode Indonesia
// - Timezone dropdown
// =====================================================
function PreferencesSection({
  profile,
  onChange,
}: {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
}) {
  // ⭐ Init theme dari localStorage (bukan profile.theme mentah)
  //    karena profile.theme bisa "System" (kapital) atau null dari DB lama
  const [form, setForm] = useState({
    theme: getCurrentTheme() as "light" | "dark" | "system",
    timezone: profile.timezone || "Asia/Jakarta",
    email_notifications: profile.email_notifications,
    push_notifications: profile.push_notifications,
    digest_frequency: profile.digest_frequency,
  });
  const [saving, setSaving] = useState(false);

  // ⭐ Saat user pilih theme: apply INSTAN ke DOM + auto-save ke DB
  const handleThemeChange = async (theme: "light" | "dark" | "system") => {
    // 1. Update state
    setForm((prev) => ({ ...prev, theme }));

    // 2. Apply ke DOM SEKARANG (instant feedback)
    applyTheme(theme);

    // 3. Auto-save ke DB (background, tidak block UI)
    try {
      const updated = await updatePreferences({ theme });
      onChange(updated);
      toast.success(
        `Tema ${theme === "light" ? "terang" : theme === "dark" ? "gelap" : "sistem"} diterapkan`,
        { duration: 2000 },
      );
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Gagal menyimpan tema";
      toast.error(msg);
      // Rollback ke theme sebelumnya
      applyTheme(form.theme);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updatePreferences({
        theme: form.theme,
        language: "id", // ⭐ hardcode Indonesian
        timezone: form.timezone,
        email_notifications: form.email_notifications,
        push_notifications: form.push_notifications,
        digest_frequency: form.digest_frequency,
      });
      onChange(updated);

      applyTheme(updated.theme);
      applyLanguage("id");

      toast.success("Preferensi diperbarui");
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const timezones = [
    { value: "Asia/Jakarta", label: "WIB — Jakarta (UTC+7)" },
    { value: "Asia/Pontianak", label: "WIB — Pontianak (UTC+7)" },
    { value: "Asia/Makassar", label: "WITA — Makassar (UTC+8)" },
    { value: "Asia/Jayapura", label: "WIT — Jayapura (UTC+9)" },
  ];

  const themeOptions: {
    value: "light" | "dark" | "system";
    label: string;
    desc: string;
    icon: string;
    bg: string;
  }[] = [
    {
      value: "light",
      label: "Terang",
      desc: "Selalu pakai tema terang",
      icon: "☀️",
      bg: "linear-gradient(135deg, #ffffff, #f1f5f9)",
    },
    {
      value: "dark",
      label: "Gelap",
      desc: "Selalu pakai tema gelap",
      icon: "🌙",
      bg: "linear-gradient(135deg, #0f172a, #1e293b)",
    },
    {
      value: "system",
      label: "Ikuti Sistem",
      desc: "Otomatis sesuai OS Anda",
      icon: "🖥️",
      bg: "linear-gradient(135deg, #e2e8f0 50%, #1e293b 50%)",
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Appearance & Preferences"
        desc="Tema, zona waktu dan notifikasi aplikasi"
      />

      {/* ============================================
          THEME PICKER
          ============================================ */}
      <div>
        <label className="mb-2 block text-[12px] font-semibold text-[var(--y-text-dim)]">
          Tema Aplikasi
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {themeOptions.map((opt) => {
            const isActive = form.theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleThemeChange(opt.value)}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                  isActive
                    ? "border-[var(--y-primary)] shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
                    : "border-[var(--y-border)] hover:border-[var(--y-primary)]",
                )}
              >
                <div
                  className="h-14 w-full rounded-lg border border-[var(--y-border)]"
                  style={{ background: opt.bg }}
                >
                  <div className="flex h-full items-center justify-center text-2xl">
                    {opt.icon}
                  </div>
                </div>

                {isActive && (
                  <div className="absolute -top-1.5 -right-1.5 grid h-6 w-6 place-items-center rounded-full bg-[var(--y-primary)] shadow-lg">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                )}

                <div className="text-center">
                  <div className="text-[12px] font-bold text-[var(--y-text)]">
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-[var(--y-text-mute)]">
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] italic text-[var(--y-text-mute)]">
          💡 Perubahan tema langsung tersimpan otomatis.
        </p>
      </div>

      {/* ============================================
          TIMEZONE & DIGEST
          ============================================ */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Zona Waktu">
          <select
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Frekuensi Digest Email">
          <select
            value={form.digest_frequency}
            onChange={(e) =>
              setForm({ ...form, digest_frequency: e.target.value as any })
            }
            className="y-focus h-10 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-sm"
          >
            <option value="realtime">Real-time</option>
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="never">Tidak pernah</option>
          </select>
        </FormField>
      </div>

      {/* ============================================
          TOGGLES
          ============================================ */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] p-3">
          <div>
            <div className="text-sm font-semibold text-[var(--y-text)]">
              Email Notifications
            </div>
            <div className="text-[11px] text-[var(--y-text-mute)]">
              Terima notifikasi via email
            </div>
          </div>
          <input
            type="checkbox"
            checked={form.email_notifications}
            onChange={(e) =>
              setForm({ ...form, email_notifications: e.target.checked })
            }
            className="h-5 w-5 rounded border-[var(--y-border)] accent-[var(--y-primary)]"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] p-3">
          <div>
            <div className="text-sm font-semibold text-[var(--y-text)]">
              Push Notifications
            </div>
            <div className="text-[11px] text-[var(--y-text-mute)]">
              Notifikasi dalam aplikasi
            </div>
          </div>
          <input
            type="checkbox"
            checked={form.push_notifications}
            onChange={(e) =>
              setForm({ ...form, push_notifications: e.target.checked })
            }
            className="h-5 w-5 rounded border-[var(--y-border)] accent-[var(--y-primary)]"
          />
        </label>
      </div>

      <div className="flex justify-end border-t border-[var(--y-border-soft)] pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="y-gradient-brand inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Simpan Preferensi
        </button>
      </div>
    </div>
  );
}

// =====================================================
// ACTIVITY SECTION
// =====================================================
function ActivitySection() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [tab, setTab] = useState<"activity" | "pages">("activity");

  const load = async () => {
    setLoading(true);
    try {
      if (tab === "activity") {
        const data = await listActivity(50, filter || undefined);
        setItems(data);
      } else {
        const data = await listPageViews(100);
        setPageViews(data);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      toast.error("Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, tab]);

  const formatAction = (action: string) => {
    const map: Record<string, string> = {
      login: "Login",
      register: "Registrasi Akun",
      logout: "Logout",
      update_profile: "Update Profil",
      update_preferences: "Update Preferensi",
      password_changed: "Password Diubah",
      upload_file: "Upload File",
      download_file: "Download File",
      preview_file: "Preview File",
      edit_file: "Edit Dokumen",
      delete_file: "Hapus File",
      share_file: "Buat Share Link",
      revoke_share: "Cabut Share Link",
      share_download: "Download via Share Link",
      update_category: "Ubah Kategori",
      reclassify: "Re-classify File",
      bulk_delete: "Bulk Hapus File",
      bulk_category: "Bulk Ubah Kategori",
      revoke_session: "Cabut Sesi",
      revoke_all_sessions: "Logout Semua Sesi",
    };
    return map[action] || action;
  };

  const filterOptions: { key: string; label: string }[] = [
    { key: "", label: "Semua Aktivitas" },
    { key: "login", label: "Login" },
    { key: "logout", label: "Logout" },
    { key: "update_profile", label: "Update Profil" },
    { key: "update_preferences", label: "Update Preferensi" },
    { key: "password_changed", label: "Password Diubah" },
    { key: "upload_file", label: "Upload File" },
    { key: "download_file", label: "Download File" },
    { key: "preview_file", label: "Preview File" },
    { key: "edit_file", label: "Edit Dokumen" },
    { key: "delete_file", label: "Hapus File" },
    { key: "share_file", label: "Share File" },
    { key: "revoke_share", label: "Cabut Share" },
    { key: "revoke_session", label: "Cabut Sesi" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Activity History"
        desc="Riwayat aktivitas akun & halaman yang dikunjungi"
      />

      <div className="inline-flex gap-1 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] p-1">
        <button
          onClick={() => setTab("activity")}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors",
            tab === "activity"
              ? "bg-[var(--y-primary)] text-white"
              : "text-[var(--y-text-dim)] hover:text-[var(--y-text)]",
          )}
        >
          <History size={12} className="mr-1 inline" />
          Aktivitas
        </button>
        <button
          onClick={() => setTab("pages")}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors",
            tab === "pages"
              ? "bg-[var(--y-primary)] text-white"
              : "text-[var(--y-text-dim)] hover:text-[var(--y-text)]",
          )}
        >
          <Globe size={12} className="mr-1 inline" />
          Halaman
        </button>
      </div>

      {tab === "activity" && (
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="y-focus h-9 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[12px]"
          >
            {filterOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 text-[12px] font-semibold text-[var(--y-text-dim)] hover:bg-[var(--y-bg-hover)]"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 size={22} className="animate-spin text-[var(--y-primary)]" />
        </div>
      ) : tab === "activity" ? (
        items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--y-border)] py-10 text-center text-sm text-[var(--y-text-mute)]">
            Belum ada aktivitas
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] p-3"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--y-bg-hover)] text-[var(--y-text-dim)]">
                  <History size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[var(--y-text)]">
                    {formatAction(item.action)}
                  </div>
                  {item.description && (
                    <div className="text-[11px] text-[var(--y-text-dim)]">
                      {item.description}
                    </div>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[var(--y-text-mute)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={9} />
                      {formatDateTime(item.created_at)}
                    </span>
                    {item.ip_address && (
                      <span className="font-mono">{item.ip_address}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : pageViews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--y-border)] py-10 text-center text-sm text-[var(--y-text-mute)]">
          Belum ada halaman yang dikunjungi
        </div>
      ) : (
        <div className="space-y-1.5">
          {pageViews.map((pv) => (
            <div
              key={pv.id}
              className="flex items-start gap-3 rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] p-3"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgba(99,102,241,0.15)] text-[var(--y-primary)]">
                <Globe size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[var(--y-text)]">
                  {pv.page_title || pv.page_path}
                </div>
                <div className="truncate font-mono text-[11px] text-[var(--y-text-dim)]">
                  {pv.page_path}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[var(--y-text-mute)]">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={9} />
                    {formatDateTime(pv.created_at)}
                  </span>
                  {pv.device_display && (
                    <span className="inline-flex items-center gap-1">
                      <Monitor size={9} />
                      {pv.device_display}
                    </span>
                  )}
                  {pv.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={9} />
                      {pv.city}
                      {pv.country ? `, ${pv.country}` : ""}
                    </span>
                  )}
                  {pv.duration_ms != null && pv.duration_ms > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Compass size={9} />
                      {(pv.duration_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// SHARED COMPONENTS
// =====================================================
function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border-b border-[var(--y-border-soft)] pb-3">
      <h2 className="text-base font-bold text-[var(--y-text)]">{title}</h2>
      <p className="text-[12px] text-[var(--y-text-dim)]">{desc}</p>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-[var(--y-text-dim)]">
        {label}
        {required && <span className="ml-1 text-[var(--y-danger)]">*</span>}
      </label>
      {children}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-[var(--y-text-dim)]">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 break-all rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] px-3 py-2 text-[13px] text-[var(--y-text)]",
          mono && "font-mono text-[11px]",
        )}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--y-text-mute)]">
        {label}:
      </span>
      <span
        className={cn(
          "min-w-0 text-[11px] text-[var(--y-text-dim)]",
          mono && "font-mono",
          truncate && "truncate",
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function getDeviceIcon(deviceType: string | null): typeof Monitor {
  switch (deviceType) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    case "bot":
      return Bot;
    default:
      return Monitor;
  }
}
