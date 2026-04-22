"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Game } from "@prisma/client";

interface BrowseGamesClientProps {
  initialGames: Game[];
}

export default function BrowseGamesClient({
  initialGames,
}: BrowseGamesClientProps) {
  const [sportFilter, setSportFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  const filteredGames = useMemo(() => {
    return initialGames.filter((game) => {
      if (sportFilter && game.sport !== sportFilter) {
        return false;
      }
      if (skillFilter && game.skillLevel !== skillFilter) {
        return false;
      }
      return true;
    });
  }, [initialGames, sportFilter, skillFilter]);

  const sports = [
    "Cricket",
    "Football",
    "Basketball",
    "Tennis",
    "Volleyball",
    "Table Tennis",
  ];
  const skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sport" className="block text-sm font-medium">
              Sport
            </label>
            <select
              id="sport"
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">None - Show All Sports</option>
              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="skillLevel" className="block text-sm font-medium">
              Skill Level
            </label>
            <select
              id="skillLevel"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">None - Show All Levels</option>
              {skillLevels.map((level) => {
                const displayLabel =
                  level === "BEGINNER"
                    ? "Beginner"
                    : level === "INTERMEDIATE"
                      ? "Intermediate"
                      : "Advanced";
                return (
                  <option key={level} value={level}>
                    {displayLabel}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">
            No games match your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredGames.map((game) => {
            const isFull = game.currentCount >= game.maxParticipants;
            return (
              <Link
                key={game.gameID}
                href={`/games/${game.gameID}`}
                className="group rounded-lg border border-zinc-200 p-4 transition hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold group-hover:text-blue-600">
                    {game.sport}
                  </h3>
                  <span
                    className={`text-xs font-medium rounded px-2 py-1 ${
                      isFull
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}
                  >
                    {isFull ? "Closed" : "Open"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(game.dateTime).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  {game.location}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {game.currentCount}/{game.maxParticipants} participants
                  </span>
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {game.skillLevel === "BEGINNER"
                      ? "Beginner"
                      : game.skillLevel === "INTERMEDIATE"
                        ? "Intermediate"
                        : "Advanced"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
