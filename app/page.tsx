import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10">
      <section className="overflow-hidden rounded-[28px] border border-[var(--up-border)] bg-[var(--up-surface)] shadow-2xl shadow-black/20 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden px-8 py-10 sm:px-10 sm:py-12">
          <div className="absolute -left-20 -bottom-20 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(163,230,53,0.12)_0%,_transparent_65%)]" />
          <div className="relative z-10 max-w-2xl space-y-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--up-accent)]">
              UniPlay Foundation
            </p>
            <div className="space-y-4">
              <h1 className="font-[family:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
                Find your game.
                <br />
                Build your team.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[var(--up-muted)] sm:text-base">
                Discover university sports games, join with your skill level,
                and stay connected with organizers — all in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[var(--up-accent)] px-4 text-sm font-bold text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[var(--up-border-mid)] px-4 text-sm font-medium text-[var(--up-text)] transition hover:border-[rgba(163,230,53,0.25)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--up-border)] bg-[rgba(255,255,255,0.015)] px-8 py-10 sm:px-10 lg:border-l lg:border-t-0">
          <div className="grid gap-4">
            <StatCard title="1) Register" text="Sign up with your university email and secure password." />
            <StatCard title="2) Verify email" text="Enter your OTP to activate your account." />
            <StatCard title="3) Use dashboard" text="Manage profile, preferences, and upcoming game features." />
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-[var(--up-border)] bg-[var(--up-surface-2)] p-5">
      <h2 className="font-[family:var(--font-display)] text-lg font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-7 text-[var(--up-muted)]">{text}</p>
    </article>
  );
}
