"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type RegisterResponse = {
  user?: {
    userID: string;
    name: string;
    email: string;
  };
  error?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = (await res.json()) as RegisterResponse;

    if (!res.ok || !data.user) {
      setError(data.error ?? "Registration failed.");
      setBusy(false);
      return;
    }

    setMessage("Registered! Check your email for OTP.");
    setBusy(false);
    router.push(`/verify-email?userID=${data.user.userID}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-6 py-10">
      <h1 className="text-3xl font-bold">Create account</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        FR-01: University registration entry point (domain policy can be enforced
        in service config).
      </p>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-5">
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border px-3 py-2 bg-transparent"
        />
        <input
          required
          type="email"
          placeholder="University email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border px-3 py-2 bg-transparent"
        />
        <input
          required
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2 bg-transparent"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border px-3 py-2 bg-transparent"
        >
          <option value="STUDENT">Student</option>
          <option value="ORGANIZER">Organizer</option>
        </select>

        <button
          disabled={busy}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-70"
        >
          {busy ? "Creating account..." : "Register"}
        </button>
      </form>

      {message ? <p className="text-emerald-600">{message}</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
    </main>
  );
}
