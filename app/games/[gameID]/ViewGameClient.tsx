"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@prisma/client";

interface ViewGameClientProps {
  game: Game & {
    creator: { userID: string; name: string | null; email: string } | null;
  };
  isCreator: boolean;
  currentUserID: string | null;
}

export default function ViewGameClient({
  game,
  isCreator,
  currentUserID,
}: ViewGameClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFull = game.currentCount >= game.maxParticipants;
  const isOpen = !isFull && game.status === "OPEN";

  const handleJoin = async () => {
    if (!currentUserID) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/games/${game.gameID}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to join game");
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isFull) {
      return (
        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800 dark:bg-red-900 dark:text-red-200">
          Closed (Full)
        </span>
      );
    }
    return (
      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
        Open
      </span>
    );
  };

  return (
    <>
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{game.sport}</h1>
        {getStatusBadge()}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Created by {game.creator?.name || game.creator?.email}
      </p>

      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Date & Time
            </p>
            <p className="mt-1 font-semibold">
              {new Date(game.dateTime).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Location
            </p>
            <p className="mt-1 font-semibold">{game.location}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Skill Level
            </p>
            <p className="mt-1 font-semibold">
              {game.skillLevel === "BEGINNER"
                ? "Beginner"
                : game.skillLevel === "INTERMEDIATE"
                  ? "Intermediate"
                  : "Advanced"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Participants
            </p>
            <p className="mt-1 font-semibold">
              {game.currentCount} / {game.maxParticipants}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {isCreator && (
          <a
            href={`/games/${game.gameID}/edit`}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Edit Game
          </a>
        )}
        <a
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Back to Home
        </a>
        {!isCreator && isOpen && (
          <button
            onClick={handleJoin}
            disabled={isLoading}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? "Joining..." : "Join Game"}
          </button>
        )}
        {!isCreator && isFull && (
          <button
            disabled
            className="rounded-lg bg-gray-400 px-4 py-2 font-medium text-white"
          >
            Game Full
          </button>
        )}
      </div>
    </>
  );
}
