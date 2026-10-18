// Login internal: Arsip Digital, Bagian Persidangan DPRD Kabupaten Kuningan.
// Tab Daftar dipertahankan (backend mendukung /auth/register, akun internal).
"use client";

import { useState } from "react";
import { Archive, Mail, Lock, User as UserIcon, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

function toFormError(e: unknown, fallback: string): string {
  // Tampilkan pesan asli backend agar tidak menyesatkan (mis. bedakan
  // "email sudah terdaftar" vs error server/validasi lainnya).
  if (e instanceof ApiError && e.detail) return e.detail;
  return fallback;
}

type Tab = "login" | "register";

export function LoginView() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const login = useYudit((s) => s.login);
  const register = useYudit((s) => s.register);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setFormError(null);
    try {
      await login(email, password);
    } catch (e) {
      // Pesan generik tanpa membocorkan detail keamanan
      setFormError("Email atau password salah. Periksa kembali dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) return;
    setLoading(true);
    setFormError(null);
    try {
      await register(email, username, password);
    } catch (err) {
      setFormError(toFormError(err, "Pendaftaran gagal. Silakan coba lagi."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="yudit-ambient relative grid min-h-screen place-items-center p-5">
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-[var(--y-primary)]">
            <Archive size={28} className="text-white" />
          </div>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-[var(--y-text)]">
            Arsip Digital
          </h1>
          <p className="mt-1 text-[13px] text-[var(--y-text-dim)]">
            Bagian Persidangan DPRD Kabupaten Kuningan
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--y-border)] bg-[var(--y-bg-elev)] p-6 sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-[var(--y-bg-elev-2)] p-1" role="tablist" aria-label="Mode autentikasi">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                type="button"
                onClick={() => { setTab(t); setFormError(null); }}
                className={cn(
                  "y-focus h-9 rounded-md text-[13px] font-semibold",
                  tab === t ? "bg-[var(--y-bg-elev)] text-[var(--y-text)] shadow-sm" : "text-[var(--y-text-dim)] hover:text-[var(--y-text)]",
                )}
              >
                {t === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          {formError && (
            <p className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--y-danger)]" role="alert">
              {formError}
            </p>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4" noValidate={false}>
              <Field
                icon={<Mail size={16} />}
                label="Email"
                type="email"
                placeholder="nama@contoh.go.id"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Field
                icon={<Lock size={16} />}
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    aria-pressed={showPassword}
                    className="y-focus grid h-8 w-8 place-items-center rounded-md text-[var(--y-text-mute)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <SubmitButton label="Masuk" loading={loading} />
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field
                icon={<UserIcon size={16} />}
                label="Nama pengguna"
                type="text"
                placeholder="Nama lengkap atau username"
                value={username}
                onChange={setUsername}
                autoComplete="username"
              />
              <Field
                icon={<Mail size={16} />}
                label="Email"
                type="email"
                placeholder="nama@contoh.go.id"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Field
                icon={<Lock size={16} />}
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                minLength={6}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    aria-pressed={showPassword}
                    className="y-focus grid h-8 w-8 place-items-center rounded-md text-[var(--y-text-mute)] hover:bg-[var(--y-bg-hover)] hover:text-[var(--y-text)]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <SubmitButton label="Buat akun" loading={loading} />
              <p className="text-xs leading-relaxed text-[var(--y-text-mute)]">
                Akun hanya untuk pegawai internal. Pembuatan akun tercatat oleh sistem.
              </p>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-[var(--y-text-mute)]">
          Dokumen internal · Bukan untuk publikasi
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  minLength,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  minLength?: number;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[var(--y-text-dim)]">
        {label}
      </label>
      <div className="group relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)]">
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          className="y-focus h-11 w-full rounded-lg border border-[var(--y-border)] bg-[var(--y-bg-elev)] pl-10 pr-11 text-sm text-[var(--y-text)] placeholder:text-[var(--y-text-mute)]"
        />
        {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  );
}

function SubmitButton({ label, loading }: { label: string; loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="y-focus flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--y-primary)] text-sm font-semibold text-white hover:bg-[var(--y-primary-hover)] disabled:opacity-70"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-label="Memproses" />
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight size={16} />
        </>
      )}
    </button>
  );
}
