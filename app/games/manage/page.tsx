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
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Manage the games you've created. Edit details, cancel games, or view
            participant info.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Back to Dashboard
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">
            You haven't created any games yet.
          </p>
          <Link
            href="/games/new"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
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
