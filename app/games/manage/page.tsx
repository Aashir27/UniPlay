import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/src/lib/auth";
import { filterGames } from "@/src/services/game.service";
import ManageGamesClient from "./ManageGamesClient";

export default async function ManageGamesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const games = await filterGames({ creatorID: session.user.id });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Games</h1>
          <p className="mt-2 text-sm text-[var(--up-muted)]">
            Manage the games you&apos;ve created. Edit details, cancel games, or view
            participant info.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-[10px] border border-[var(--up-border-mid)] px-4 py-2 font-medium text-[var(--up-text)] transition hover:border-[rgba(163,230,53,0.25)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
        >
          Back to Dashboard
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-8 text-center">
          <p className="text-[var(--up-muted)]">
            You haven&apos;t created any games yet.
          </p>
          <Link
            href="/games/new"
            className="mt-4 inline-block rounded-[10px] bg-[var(--up-accent)] px-4 py-2 font-medium text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)]"
          >
            Post a Game
          </Link>
        </div>
      ) : (
        <ManageGamesClient games={games} />
      )}
    </main>
  );
}
