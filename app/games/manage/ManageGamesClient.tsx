"use client";

import { useState } from "react";
import Link from "next/link";
import type { Game } from "@prisma/client";

interface ManageGamesClientProps {
  games: Game[];
}

export default function ManageGamesClient({ games }: ManageGamesClientProps) {
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localGames, setLocalGames] = useState(games);

  const handleDelete = async (gameID: string) => {
    if (
      !confirm("Mark this game as completed? This will delete the game post.")
    ) {
      return;
    }

    setDeleteLoading(gameID);
    setError(null);

    try {
      const response = await fetch(`/api/games/${gameID}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to mark game as completed");
        return;
      }

      setLocalGames((prev) => prev.filter((g) => g.gameID !== gameID));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCancel = async (gameID: string) => {
    if (!confirm("Cancel this game? This will delete the game post.")) {
      return;
    }

    setDeleteLoading(gameID);
    setError(null);

    try {
      const response = await fetch(`/api/games/${gameID}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to cancel game");
        return;
      }

      setLocalGames((prev) => prev.filter((g) => g.gameID !== gameID));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      OPEN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      FULL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      COMPLETED:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };

    return (
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {localGames.map((game) => (
          <div
            key={game.gameID}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{game.sport}</h3>
                {getStatusBadge(game.status)}
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(game.dateTime).toLocaleString()} • {game.location}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                {game.currentCount}/{game.maxParticipants} participants
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/games/${game.gameID}/edit`}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(game.gameID)}
                disabled={deleteLoading === game.gameID}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading === game.gameID
                  ? "Marking..."
                  : "Mark Completed"}
              </button>
              <button
                onClick={() => handleCancel(game.gameID)}
                disabled={deleteLoading === game.gameID}
                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {deleteLoading === game.gameID ? "Cancelling..." : "Cancel"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
