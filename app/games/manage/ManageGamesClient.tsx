"use client";

import { useState } from "react";
import Link from "next/link";
import type { Game } from "@prisma/client";

interface ManageGamesClientProps {
  games: Game[];
}

export default function ManageGamesClient({ games }: ManageGamesClientProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localGames, setLocalGames] = useState(games);

  async function patchStatus(gameID: string, status: "COMPLETED" | "CANCELLED") {
    setActionLoading(gameID + status);
    setError(null);

    try {
      const response = await fetch(`/api/games/${gameID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? `Failed to update game`);
        return;
      }

      setLocalGames((prev) =>
        prev.map((g) =>
          g.gameID === gameID ? { ...g, status } : g,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(null);
    }
  }

  const handleComplete = (gameID: string) => {
    if (!confirm("Mark this game as completed?")) return;
    patchStatus(gameID, "COMPLETED");
  };

  const handleCancel = (gameID: string) => {
    if (!confirm("Cancel this game? Players will no longer be able to join.")) return;
    patchStatus(gameID, "CANCELLED");
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      OPEN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      FULL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return (
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${styles[status] ?? "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </span>
    );
  };

  const isTerminal = (status: string) =>
    status === "CANCELLED" || status === "COMPLETED";

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {localGames.map((game) => {
          const busy = actionLoading?.startsWith(game.gameID) ?? false;
          const terminal = isTerminal(game.status);

          return (
            <div
              key={game.gameID}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{game.sport}</h3>
                  {statusBadge(game.status)}
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(game.dateTime).toLocaleString()} • {game.location}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  {game.currentCount}/{game.maxParticipants} participants
                </p>
              </div>

              {!terminal && (
                <div className="flex gap-2">
                  <Link
                    href={`/games/${game.gameID}/edit`}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleComplete(game.gameID)}
                    disabled={busy}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === game.gameID + "COMPLETED"
                      ? "Saving..."
                      : "Mark Completed"}
                  </button>
                  <button
                    onClick={() => handleCancel(game.gameID)}
                    disabled={busy}
                    className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    {actionLoading === game.gameID + "CANCELLED"
                      ? "Cancelling..."
                      : "Cancel"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
