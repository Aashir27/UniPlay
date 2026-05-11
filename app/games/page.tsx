import type { GameStatus, SkillLevel } from "@prisma/client";
import Link from "next/link";

import { filterGames } from "@/src/services/game.service";
import BrowseGamesClient from "./BrowseGamesClient";

const skillLevels = new Set<SkillLevel>([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);

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
  const skillLevel = skillLevels.has(params.skillLevel as SkillLevel)
    ? (params.skillLevel as SkillLevel)
    : undefined;

  const games = await filterGames({
    sport,
    skillLevel,
    status: ["OPEN", "FULL"] as GameStatus[],
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold">Browse Games</h1>
        <p className="mt-2 text-sm text-[var(--up-muted)]">
          Find games you like.
        </p>
      </div>

      <BrowseGamesClient initialGames={games} />

      {games.length === 0 && (
        <div className="rounded-lg border border-[var(--up-border)] bg-[var(--up-surface)] p-8 text-center">
          <p className="text-[var(--up-muted)]">
            No open games found. Check back later or adjust your filters.
          </p>
          <Link
            href="/games/new"
            className="mt-4 inline-block rounded-lg bg-[var(--up-accent)] px-4 py-2 font-medium text-[#0b0f1a] hover:bg-[var(--up-accent-dim)]"
          >
            Post a Game
          </Link>
        </div>
      )}
    </main>
  );
}
