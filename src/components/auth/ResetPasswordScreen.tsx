"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ResetPasswordScreen({ token, uid }: { token?: string; uid?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!token || !uid) {
      setError("Missing token or user identifier.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: uid, token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reset failed");
        setBusy(false);
        return;
      }

      setSuccess(true);
      // redirect to login after short delay
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      console.error("reset-password", err);
      setError("Reset failed");
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md">
        <h2 className="text-2xl font-bold">Password reset</h2>
        <p className="mt-3 text-[var(--up-muted)]">Your password was updated. Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-bold">Set a new password</h2>
      <p className="mt-2 text-sm text-[var(--up-muted)]">Choose a new password for your account.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm text-[var(--up-muted)]">New password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            className="mt-1 h-11 w-full rounded-[10px] border border-[var(--up-border-mid)] bg-[var(--up-surface)] px-3 text-sm text-[var(--up-text)] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--up-muted)]">Confirm password</label>
          <input
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            type="password"
            autoComplete="new-password"
            className="mt-1 h-11 w-full rounded-[10px] border border-[var(--up-border-mid)] bg-[var(--up-surface)] px-3 text-sm text-[var(--up-text)] outline-none"
          />
        </div>

        {error ? <div className="text-sm text-[var(--up-danger)]">{error}</div> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 flex h-11 w-full items-center justify-center rounded-[10px] bg-[var(--up-accent)] text-sm font-bold text-[#0b0f1a] disabled:opacity-60"
        >
          {busy ? "Working…" : "Set password"}
        </button>
      </form>
    </div>
  );
}
