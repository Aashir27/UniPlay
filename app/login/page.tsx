"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setError("Login failed. Check credentials and ensure email is verified.");
      setBusy(false);
      return;
    }

    setBusy(false);
    router.push("/profile");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-6 py-10">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        FR-03 and FR-04: bcrypt-backed credentials + JWT session via NextAuth.
      </p>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-5">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2 bg-transparent"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-md border px-3 py-2 bg-transparent"
        />

        <button
          disabled={busy}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-70"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {error ? <p className="text-red-600">{error}</p> : null}

      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        New here? <Link href="/register" className="text-emerald-600 underline">Create account</Link>
      </div>
    </main>
  );
}
