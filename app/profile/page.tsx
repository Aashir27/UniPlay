import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth";
import { ProfileClient } from "@/app/profile/ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="rounded-[24px] border border-[var(--up-border)] bg-[var(--up-surface)] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--up-muted)]">
          Your profile
        </p>
        <h1 className="mt-3 font-[family:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome, {session.user.name}
        </h1>
        <p className="mt-2 text-sm text-[var(--up-muted)]">
          Keep your sports preferences up to date for better matches.
        </p>
      </header>

      <ProfileClient />
    </main>
  );
}
