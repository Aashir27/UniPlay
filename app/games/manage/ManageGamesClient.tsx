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
      DRAFT: "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]",
      OPEN: "border border-[rgba(163,230,53,0.25)] bg-[var(--up-accent-bg)] text-[var(--up-accent)]",
      FULL: "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]",
      CANCELLED: "border border-[rgba(248,113,113,0.2)] bg-[var(--up-danger-bg)] text-[var(--up-danger)]",
      COMPLETED: "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]",
    };
    return (
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${styles[status] ?? styles.DRAFT}`}
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
        <div className="rounded-[10px] border border-[rgba(248,113,113,0.18)] bg-[var(--up-danger-bg)] p-4 text-sm text-[var(--up-danger)]">
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
              className="flex flex-col gap-3 rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{game.sport}</h3>
                  {statusBadge(game.status)}
                </div>
                <p className="mt-1 text-sm text-[var(--up-muted)]">
                  {new Date(game.dateTime).toLocaleString()} • {game.location}
                </p>
                <p className="mt-1 text-xs text-[var(--up-muted)]">
                  {game.currentCount}/{game.maxParticipants} participants
                </p>
              </div>

              {!terminal && (
                <div className="flex gap-2">
                  <Link
                    href={`/games/${game.gameID}/edit`}
                    className="rounded-[10px] border border-[var(--up-border-mid)] px-3 py-2 text-sm font-medium text-[var(--up-text)] transition hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleComplete(game.gameID)}
                    disabled={busy}
                    className="rounded-[10px] bg-[var(--up-accent)] px-3 py-2 text-sm font-medium text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)] disabled:opacity-50"
                  >
                    {actionLoading === game.gameID + "COMPLETED"
                      ? "Saving..."
                      : "Mark Completed"}
                  </button>
                  <button
                    onClick={() => handleCancel(game.gameID)}
                    disabled={busy}
                    className="rounded-[10px] border border-[rgba(248,113,113,0.25)] px-3 py-2 text-sm font-medium text-[var(--up-danger)] transition hover:bg-[var(--up-danger-bg)] disabled:opacity-50"
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
