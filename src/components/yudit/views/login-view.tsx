// src/components/yudit/views/login-view.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud, Mail, Lock, User as UserIcon, ArrowRight, Loader2,
  Search, CheckCircle2, XCircle, Send, ShieldCheck, Crown, UserRound,
} from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  checkAccount,
  type AccountCheckAccount,
} from "@/lib/api/auth";

type Tab = "login" | "register" | "check";

// =====================================================
// MAIN
// =====================================================
export function LoginView() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // ⭐ State cek akun
  const [checkEmail, setCheckEmail] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    found: boolean;
    accounts: AccountCheckAccount[];
    emailSent?: boolean;
    message: string;
  } | null>(null);

  const login = useYudit((s) => s.login);
  const register = useYudit((s) => s.register);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      const detail = error?.detail || error?.message || "";
      if (detail.includes("dinonaktifkan")) {
        toast.error(
          "Akun Anda dinonaktifkan. Hubungi owner workspace untuk mengaktifkan kembali.",
          { duration: 6000 },
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username || loading) return;
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    setLoading(true);
    try {
      await register(email, username, password);
    } catch (error: any) {
      const detail =
        error instanceof ApiError
          ? error.detail
          : error?.detail || error?.message || "";
      const detailLower = String(detail).toLowerCase();

      if (
        detailLower.includes("email sudah terdaftar") ||
        detailLower.includes("email already")
      ) {
        toast.error(
          "Email ini sudah terdaftar. Silakan login atau gunakan email lain.",
          { duration: 6000 },
        );
        setTimeout(() => {
          setTab("login");
          setPassword("");
        }, 1500);
        return;
      }
      if (
        detailLower.includes("username sudah dipakai") ||
        detailLower.includes("username already")
      ) {
        toast.error("Username sudah dipakai. Coba username lain.", {
          duration: 6000,
        });
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Handle check account
  const handleCheckAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEmail.trim() || checkLoading) return;

    // Validasi format email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkEmail.trim())) {
      toast.error("Format email tidak valid");
      return;
    }

    setCheckLoading(true);
    setCheckResult(null);
    try {
      const res = await checkAccount(checkEmail);
      setCheckResult(res);
      if (res.found) {
        toast.success(
          res.email_sent
            ? "Info akun telah dikirim ke email tersebut"
            : "Akun ditemukan (email gagal dikirim, hubungi admin)",
          { duration: 5000 },
        );
      } else {
        toast.info("Tidak ada akun aktif dengan email tersebut", {
          duration: 5000,
        });
      }
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 429) {
        toast.error(
          "Terlalu banyak percobaan. Tunggu beberapa menit sebelum coba lagi.",
          { duration: 6000 },
        );
      } else {
        toast.error(
          error?.detail || "Gagal memeriksa akun. Coba lagi.",
          { duration: 5000 },
        );
      }
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="yudit-ambient relative grid min-h-screen place-items-center overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--y-primary), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--y-accent), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="y-glass-strong y-glow-soft relative z-10 w-full max-w-[460px] rounded-3xl border border-[var(--y-border)] p-8"
      >
        <div className="mb-6 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring", stiffness: 200, damping: 15, delay: 0.1,
            }}
            className="y-gradient-brand y-glow-primary mb-4 grid h-16 w-16 place-items-center rounded-2xl"
          >
            <Cloud size={32} className="text-white" fill="currentColor" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--y-text)]">
            DPRD<span className="y-gradient-text">Cloud</span>
          </h1>
          <p className="mt-1.5 text-center text-[13px] text-[var(--y-text-dim)]">
            Satu cloud virtual, banyak Google Drive di belakangnya
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-[var(--y-bg)] p-1">
          {(
            [
              { key: "login", label: "Masuk" },
              { key: "register", label: "Daftar" },
              { key: "check", label: "Cek Akun" },
            ] as { key: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="relative flex-1 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors"
              style={{
                color: tab === t.key ? "var(--y-text)" : "var(--y-text-dim)",
              }}
            >
              {tab === t.key && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-lg bg-[var(--y-bg-elev)] shadow-sm"
                  style={{ border: "1px solid var(--y-border-soft)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <Field
                icon={<Mail size={16} />}
                label="Email"
                type="email"
                placeholder="kamu@example.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Field
                icon={<Lock size={16} />}
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
              <SubmitButton label="Masuk" loading={loading} />
            </motion.form>
          )}

          {tab === "register" && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <Field
                icon={<UserIcon size={16} />}
                label="Username"
                type="text"
                placeholder="username"
                value={username}
                onChange={setUsername}
                autoComplete="username"
              />
              <Field
                icon={<Mail size={16} />}
                label="Email"
                type="email"
                placeholder="kamu@example.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Field
                icon={<Lock size={16} />}
                label="Password"
                type="password"
                placeholder="min 8 karakter"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
              />
              <SubmitButton label="Daftar" loading={loading} />
            </motion.form>
          )}

          {tab === "check" && (
            <motion.div
              key="check"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-4 rounded-xl border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.06)] p-3 text-[12px] leading-relaxed text-[var(--y-text-dim)]">
                <div className="mb-1 flex items-center gap-1.5 font-semibold text-[var(--y-primary)]">
                  <Send size={12} />
                  Lupa Akun?
                </div>
                Masukkan email Anda. Jika terdaftar, kami akan mengirim info
                akun (username, role, workspace owner) ke email tersebut.
                <b className="mt-1 block text-[var(--y-text)]">
                  Password TIDAK akan dikirim via email.
                </b>
              </div>

              <form onSubmit={handleCheckAccount} className="space-y-4">
                <Field
                  icon={<Mail size={16} />}
                  label="Email Terdaftar"
                  type="email"
                  placeholder="kamu@example.com"
                  value={checkEmail}
                  onChange={setCheckEmail}
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={checkLoading || !checkEmail.trim()}
                  className={cn(
                    "y-gradient-brand y-glow-primary group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold text-white transition-all",
                    "hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0",
                  )}
                >
                  {checkLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Search size={16} />
                      <span>Cek & Kirim Info Akun</span>
                    </>
                  )}
                </button>
              </form>

              {/* Result */}
              {checkResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  {!checkResult.found ? (
                    <div className="rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] p-3">
                      <div className="mb-1 flex items-center gap-1.5 font-semibold text-[var(--y-danger)]">
                        <XCircle size={14} />
                        Tidak Ada Akun
                      </div>
                      <p className="text-[12px] leading-relaxed text-[var(--y-text-dim)]">
                        {checkResult.message}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 rounded-xl border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.06)] p-3">
                        <CheckCircle2 size={14} className="text-[#10b981]" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-[#10b981]">
                            {checkResult.accounts.length} Akun Terdaftar
                          </div>
                          <div className="text-[11px] text-[var(--y-text-dim)]">
                            {checkResult.email_sent
                              ? "Info akun telah dikirim ke email Anda"
                              : "Email gagal dikirim — hubungi admin"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {checkResult.accounts.map((acc, i) => (
                          <AccountCard key={i} account={acc} />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer hint */}
        <div className="mt-5 text-center text-[11px] text-[var(--y-text-mute)]">
          {tab === "login" && (
            <>
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => setTab("register")}
                className="font-semibold text-[var(--y-primary)] hover:underline"
              >
                Daftar
              </button>
              {" · "}
              <button
                type="button"
                onClick={() => setTab("check")}
                className="font-semibold text-[var(--y-primary)] hover:underline"
              >
                Lupa Akun?
              </button>
            </>
          )}
          {tab === "register" && (
            <>
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => setTab("login")}
                className="font-semibold text-[var(--y-primary)] hover:underline"
              >
                Masuk
              </button>
            </>
          )}
          {tab === "check" && (
            <>
              Sudah ingat?{" "}
              <button
                type="button"
                onClick={() => setTab("login")}
                className="font-semibold text-[var(--y-primary)] hover:underline"
              >
                Masuk
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// =====================================================
// ACCOUNT CARD
// =====================================================
function AccountCard({ account }: { account: AccountCheckAccount }) {
  const roleMeta = {
    owner: {
      label: "Owner",
      icon: Crown,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
    },
    super_admin: {
      label: "Super Admin",
      icon: ShieldCheck,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    },
    member: {
      label: "Member",
      icon: UserRound,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.1)",
    },
  }[account.role] ?? {
    label: account.role,
    icon: UserRound,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.1)",
  };

  const Icon = roleMeta.icon;

  return (
    <div className="rounded-lg border border-[var(--y-border)] bg-[var(--y-bg)] p-2.5">
      <div className="mb-1.5 flex items-center gap-2">
        <div
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
          style={{ background: roleMeta.bg, color: roleMeta.color }}
        >
          <Icon size={13} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-[var(--y-text)]">
            {account.username}
          </div>
          <div className="text-[10.5px] text-[var(--y-text-mute)]">
            {roleMeta.label}
            {account.workspace_owner_email && (
              <>
                {" · "}
                <span className="truncate">
                  Owner: {account.workspace_owner_email}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="text-[10.5px] leading-relaxed text-[var(--y-text-dim)]">
        {account.role_permission_summary}
      </p>
    </div>
  );
}

// =====================================================
// FIELD
// =====================================================
function Field({
  icon, label, type, placeholder, value, onChange, autoComplete,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[var(--y-text-dim)]">
        {label}
      </label>
      <div className="group relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--y-text-mute)] transition-colors group-focus-within:text-[var(--y-primary)]">
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className="y-focus h-11 w-full rounded-xl border border-[var(--y-border)] bg-[var(--y-bg)] pl-10 pr-4 text-sm text-[var(--y-text)] placeholder:text-[var(--y-text-mute)] transition-all"
        />
      </div>
    </div>
  );
}

// =====================================================
// SUBMIT BUTTON
// =====================================================
function SubmitButton({ label, loading }: { label: string; loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "y-gradient-brand y-glow-primary group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold text-white transition-all",
        "hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0",
      )}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <>
          <span className="relative z-10">{label}</span>
          <ArrowRight
            size={16}
            className="relative z-10 transition-transform group-hover:translate-x-0.5"
          />
        </>
      )}
    </button>
  );
}
