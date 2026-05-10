"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to send reset email");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md">
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="mt-3 text-[var(--up-muted)]">If an account exists for that address, you will receive a password reset link shortly.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-bold">Forgot your password?</h2>
      <p className="mt-2 text-sm text-[var(--up-muted)]">Enter your email and we'll send a link to reset your password.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm text-[var(--up-muted)]">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1 h-11 w-full rounded-[10px] border border-[var(--up-border-mid)] bg-[var(--up-surface)] px-3 text-sm text-[var(--up-text)] outline-none"
          />
        </div>

        {error ? <div className="text-sm text-[var(--up-danger)]">{error}</div> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--up-accent)] text-sm font-bold text-[#0b0f1a] disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
