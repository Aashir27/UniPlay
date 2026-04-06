"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type VerifyResponse = { ok?: boolean; error?: string };

export function VerifyEmailClient({
  initialUserID,
}: {
  initialUserID: string;
}) {
  const [userID, setUserID] = useState(initialUserID);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID, otp }),
    });

    const data = (await res.json()) as VerifyResponse;

    if (!res.ok) {
      setError(data.error ?? "Verification failed.");
      setBusy(false);
      return;
    }

    setMessage("Email verified! You can now sign in.");
    setBusy(false);
  }

  async function onResend() {
    setBusy(true);
    setMessage(null);
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

    setMessage("A new OTP has been sent.");
    setBusy(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-6 py-10">
      <h1 className="text-3xl font-bold">Verify your email</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        FR-02: OTP-based email verification.
      </p>

      <form onSubmit={onVerify} className="space-y-4 rounded-xl border p-5">
        <input
          required
          value={userID}
          onChange={(e) => setUserID(e.target.value)}
          placeholder="User ID (UUID)"
          className="w-full rounded-md border px-3 py-2 bg-transparent"
        />
        <input
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="6-digit OTP"
          pattern="\d{6}"
          className="w-full rounded-md border px-3 py-2 bg-transparent"
        />

        <button
          disabled={busy}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-70"
        >
          {busy ? "Verifying..." : "Verify"}
        </button>

        <button
          type="button"
          onClick={onResend}
          disabled={busy || userID.trim().length === 0}
          className="w-full rounded-md border px-4 py-2"
        >
          Resend OTP
        </button>
      </form>

      {message ? <p className="text-emerald-600">{message}</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      <Link href="/login" className="text-sm text-emerald-600 underline">
        Go to login
      </Link>
    </main>
  );
}
