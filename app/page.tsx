import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            UniPlay Foundation
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Sprint-ready backend baseline
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            This page is intentionally simple. Use it as a neutral starting
            point while you incrementally integrate each sprint feature.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Current Baseline</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Prisma schema and relations in place</li>
              <li>Service layer skeletons in src/services</li>
              <li>Credentials auth skeleton in src/lib/auth.ts</li>
              <li>AWS-focused deploy workflow and Dockerfile</li>
            </ul>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Next Integration Steps</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Sprint 1: auth routes + email verification flow</li>
              <li>Sprint 2: game and profile APIs</li>
              <li>Sprint 3: notifications and role middleware</li>
              <li>Sprint 4: recommendation and optimization</li>
            </ul>
          </article>
        </section>

        <section className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          No platform branding is baked into this page. Deployment target can
          remain AWS as you add features.
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Sprint 1 Starter Screens</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Link href="/register" className="rounded-md border px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              /register — University registration
            </Link>
            <Link href="/verify-email" className="rounded-md border px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              /verify-email — OTP verification
            </Link>
            <Link href="/login" className="rounded-md border px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              /login — Secure sign-in
            </Link>
            <Link href="/profile" className="rounded-md border px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              /profile — Auth-required profile
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
