"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type VerifyResponse = { ok?: boolean; error?: string };

export function VerifyEmailScreen({ initialUserID }: { initialUserID: string }) {
  const router = useRouter();
  const [userID, setUserID] = useState(initialUserID);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otp = digits.join("");

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => router.push("/login"), 1600);
      return () => clearTimeout(t);
    }
  }, [success, router]);

  function handleDigit(index: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKey(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function onVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setBusy(true);
    setError(null);

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID, otp }),
    });
    const data = (await res.json()) as VerifyResponse;

    if (!res.ok) {
      setError(data.error ?? "Verification failed. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setBusy(false);
      return;
    }

    setSuccess(true);
    setBusy(false);
  }

  async function onResend() {
    setBusy(true);
    setError(null);

    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID }),
    });
    const data = (await res.json()) as VerifyResponse;

    if (!res.ok) {
      setError(data.error ?? "Resend failed.");
      setBusy(false);
      return;
    }

    setResendCooldown(60);
    setBusy(false);
  }

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) {
          window.clearInterval(t);
          return 0;
        }
        return v - 1;
      });
    }, 1000);

    return () => window.clearInterval(t);
  }, [resendCooldown]);

  if (success) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--up-bg)] px-6 text-[var(--up-text)]">
        <div className="w-full max-w-md rounded-3xl border border-[var(--up-border)] bg-[var(--up-surface)] p-8 text-center shadow-2xl shadow-black/20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(163,230,53,0.25)] bg-[var(--up-accent-bg)] text-[var(--up-accent)]">
            <CheckIcon />
          </div>
          <h2 className="font-[family:var(--font-display)] text-3xl font-bold">Email verified!</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--up-muted)]">
            Your account is ready. Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--up-bg)] text-[var(--up-text)] lg:flex">
      <aside className="relative hidden overflow-hidden border-r border-[var(--up-border)] bg-[var(--up-surface)] px-10 py-12 lg:flex lg:w-[38%] lg:flex-col lg:justify-center lg:gap-10">
        <div className="absolute -bottom-16 right-[-50px] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,_rgba(163,230,53,0.12)_0%,_transparent_65%)]" />
        <LogoMark />
        <div className="relative z-10 max-w-md space-y-4">
          <h2 className="font-[family:var(--font-display)] text-4xl font-bold leading-[1.08]">
            Almost there.
          </h2>
          <p className="max-w-md text-sm leading-7 text-[var(--up-muted)]">
            We've sent a 6-digit code to your university email. It expires in 15 minutes.
          </p>
        </div>

        <div className="relative z-10 rounded-2xl border border-[rgba(163,230,53,0.15)] bg-[var(--up-accent-bg)] p-4">
          <div className="flex gap-3">
            <InfoIcon />
            <p className="text-sm leading-6 text-[var(--up-muted)]">
              Can't find it? Check your spam folder or request a new code.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md rounded-3xl border border-[var(--up-border)] bg-[var(--up-surface)] p-6 shadow-2xl shadow-black/20 sm:p-8 lg:bg-transparent lg:border-0 lg:shadow-none">
          <div className="mb-6 lg:hidden">
            <LogoMark />
          </div>

          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--up-accent)]">
            Step 2 of 3
          </p>
          <h1 className="mt-2 font-[family:var(--font-display)] text-3xl font-bold tracking-tight">
            Verify your email
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--up-muted)]">
            Enter the 6-digit code sent to your university address.
          </p>

          <form onSubmit={onVerify} className="mt-6 space-y-4">
            <Field label="Account ID">
              <input
                value={userID}
                onChange={(e) => setUserID(e.target.value)}
                placeholder="UUID from registration"
                className="h-11 w-full rounded-[10px] border border-[var(--up-border-mid)] bg-[var(--up-surface)] px-3 text-sm text-[var(--up-text)] outline-none placeholder:text-[var(--up-muted)] focus:border-[rgba(163,230,53,0.45)]"
              />
            </Field>

            <div className="space-y-1.5">
              <label className="text-[0.78rem] font-medium text-[var(--up-muted)]">6-digit code</label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKey(i, e)}
                    onPaste={handlePaste}
                    aria-label={`Digit ${i + 1}`}
                    className={`h-12 w-12 rounded-[12px] border bg-[var(--up-surface)] text-center font-[family:var(--font-display)] text-xl font-bold text-[var(--up-text)] outline-none transition placeholder:text-[var(--up-muted)] focus:border-[rgba(163,230,53,0.45)] ${
                      d
                        ? "border-[rgba(163,230,53,0.45)] bg-[var(--up-accent-bg)]"
                        : "border-[var(--up-border-mid)]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-[10px] border border-[rgba(248,113,113,0.18)] bg-[var(--up-danger-bg)] px-3 py-2 text-sm text-[var(--up-danger)]">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[var(--up-danger)]" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy || otp.length !== 6}
              className="flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--up-accent)] font-[family:var(--font-display)] text-sm font-bold text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Spinner /> : "Verify code"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.8rem] font-medium text-[var(--up-muted)]">Didn't receive it?</p>
              <button
                type="button"
                onClick={onResend}
                disabled={busy || resendCooldown > 0}
                className="mt-1 text-[0.82rem] font-semibold text-[var(--up-accent)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>

            <Link href="/register" className="text-sm font-medium text-[var(--up-muted)] hover:text-[var(--up-text)]">
              ← Back to sign up
            </Link>
          </div>
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

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" className="mt-0.5 flex-shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
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

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
