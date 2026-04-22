import { filterGames } from "@/src/services/game.service";
import Link from "next/link";
import BrowseGamesClient from "./BrowseGamesClient";

export default async function BrowseGamesPage({
  searchParams,
}: {
  searchParams: Promise<{
    sport?: string;
    skillLevel?: string;
  }>;
}) {
  const params = await searchParams;
  const sport = params.sport?.trim() || undefined;
  const skillLevel = params.skillLevel || undefined;

  const games = await filterGames({
    sport,
    skillLevel: skillLevel as any,
    status: "OPEN" as any,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold">Browse Games</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Find and join open games in your area and skill level.
        </p>
      </div>

      <BrowseGamesClient initialGames={games} />

      {games.length === 0 && (
        <div className="rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">
            No open games found. Check back later or adjust your filters.
          </p>
          <Link
            href="/games/new"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Post a Game
          </Link>
        </div>
      )}
    </main>
  );
}
