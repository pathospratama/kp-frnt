// src/components/yudit/views/login-view.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from "lucide-react";
import { useYudit } from "@/lib/yudit/store";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";

export function LoginView() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useYudit((s) => s.login);
  const register = useYudit((s) => s.register);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      // error sudah di-toast
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) return;
    setLoading(true);
    try {
      await register(email, username, password);
    } catch {
      // error sudah di-toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="yudit-ambient relative grid min-h-screen place-items-center overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--y-primary), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--y-accent), transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="y-glass-strong y-glow-soft relative z-10 w-full max-w-[420px] rounded-3xl border border-[var(--y-border)] p-8"
      >
        <div className="mb-6 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="y-gradient-brand y-glow-primary mb-4 grid h-16 w-16 place-items-center rounded-2xl"
          >
            <Cloud size={32} className="text-white" fill="currentColor" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--y-text)]">
            Yudit<span className="y-gradient-text">Cloud</span>
          </h1>
          <p className="mt-1.5 text-center text-[13px] text-[var(--y-text-dim)]">
            Satu cloud virtual, banyak Google Drive di belakangnya
          </p>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl bg-[var(--y-bg)] p-1">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="relative flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors"
              style={{ color: tab === t ? "var(--y-text)" : "var(--y-text-dim)" }}
            >
              {tab === t && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-lg bg-[var(--y-bg-elev)] shadow-sm"
                  style={{ border: "1px solid var(--y-border-soft)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {t === "login" ? "Masuk" : "Daftar"}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "login" ? (
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
          ) : (
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
                placeholder="min 6 karakter"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
              />
              <SubmitButton label="Daftar" loading={loading} />
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
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
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </>
      )}
    </button>
  );
}