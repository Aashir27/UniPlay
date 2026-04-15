"use client";

import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Incorrect email or password, or account not yet verified.");
      setBusy(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--up-bg)] text-[var(--up-text)] lg:flex">
      <aside className="relative hidden overflow-hidden border-r border-[var(--up-border)] bg-[var(--up-surface)] px-10 py-12 lg:flex lg:w-[42%] lg:flex-col lg:justify-center lg:gap-10">
        <div className="absolute -bottom-24 -left-20 h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,_rgba(163,230,53,0.12)_0%,_transparent_65%)]" />
        <LogoMark />
        <div className="relative z-10 max-w-md space-y-4">
          <h2 className="font-[family:var(--font-display)] text-4xl font-bold leading-[1.08]">
            Play more.
            <br />
            Organise less.
          </h2>
          <p className="max-w-md text-sm leading-7 text-[var(--up-muted)]">
            Find teammates, join games, and build your sports community — all
            within your university.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2">
          {[
            "⚽ Football",
            "🏀 Basketball",
            "🎾 Tennis",
            "🏏 Cricket",
            "🏐 Volleyball",
            "🏓 Table Tennis",
          ].map((sport) => (
            <span
              key={sport}
              className="rounded-full border border-[rgba(163,230,53,0.2)] bg-[var(--up-accent-bg)] px-3 py-1 text-[0.72rem] font-medium text-[var(--up-accent)]"
            >
              {sport}
            </span>
          ))}
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md rounded-3xl border border-[var(--up-border)] bg-[var(--up-surface)] p-6 shadow-2xl shadow-black/20 sm:p-8 lg:bg-transparent lg:border-0 lg:shadow-none">
          <div className="mb-6 lg:hidden">
            <LogoMark />
          </div>

          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--up-accent)]">
            Welcome back
          </p>
          <h1 className="mt-2 font-[family:var(--font-display)] text-3xl font-bold tracking-tight">
            Sign in to UniPlay
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--up-muted)]">
            Continue to your dashboard, profile, and game feed.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="University email">
              <input
                required
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="h-11 w-full rounded-[10px] border border-[var(--up-border-mid)] bg-[var(--up-surface)] px-3 text-sm text-[var(--up-text)] outline-none placeholder:text-[var(--up-muted)] focus:border-[rgba(163,230,53,0.45)]"
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  required
                  type={showPass ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-[10px] border border-[var(--up-border-mid)] bg-[var(--up-surface)] px-3 pr-11 text-sm text-[var(--up-text)] outline-none placeholder:text-[var(--up-muted)] focus:border-[rgba(163,230,53,0.45)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[var(--up-muted)] transition hover:text-[var(--up-text)]"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </Field>

            {error ? (
              <div className="flex items-start gap-2 rounded-[10px] border border-[rgba(248,113,113,0.18)] bg-[var(--up-danger-bg)] px-3 py-2 text-sm text-[var(--up-danger)]">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[var(--up-danger)]" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--up-accent)] font-[family:var(--font-display)] text-sm font-bold text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Spinner /> : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--up-muted)]">
            No account?{" "}
            <Link href="/register" className="font-medium text-[var(--up-accent)]">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[0.78rem] font-medium text-[var(--up-muted)]">{label}</label>
      {children}
    </div>
  );
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect width="28" height="28" rx="8" fill="#a3e635" />
        <path d="M7 14 L14 7 L21 14 L14 21 Z" fill="#0b0f1a" />
        <circle cx="14" cy="14" r="3" fill="#a3e635" />
      </svg>
      <span className="font-[family:var(--font-display)] text-lg font-bold tracking-tight">
        UniPlay
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="animate-spin">
      <circle cx="9" cy="9" r="7" stroke="rgba(11,15,26,0.3)" strokeWidth="2.5" fill="none" />
      <path d="M9 2 A7 7 0 0 1 16 9" stroke="#0b0f1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
