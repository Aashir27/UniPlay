import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth";
import { InvitePlayersClient } from "@/app/invite-players/InvitePlayersClient";

export default async function InvitePlayersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-5">
        <h1 className="font-[family:var(--font-display)] text-3xl font-bold">
          Invite Players
        </h1>
        <p className="mt-2 text-sm text-[var(--up-muted)]">
          Find and connect with other players.
        </p>
      </header>

      <InvitePlayersClient />
    </main>
  );
}
