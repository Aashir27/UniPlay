"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Game } from "@prisma/client";
import { formatGameDateTime } from "@/lib/formatTime";
import { createGameActionHandlers } from "@/src/components/games/gameActions";

interface ManageGamesClientProps {
  games: Game[];
}

export default function ManageGamesClient({ games }: ManageGamesClientProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localGames, setLocalGames] = useState(games);
  const [deletingGameID, setDeletingGameID] = useState<string | null>(null);
  const [withdrawingGameID, setWithdrawingGameID] = useState<string | null>(null);
  const [leaveConfirmGameID, setLeaveConfirmGameID] = useState<string | null>(null);
  const [deleteConfirmGameID, setDeleteConfirmGameID] = useState<string | null>(null);
  const [completeConfirmGameID, setCompleteConfirmGameID] = useState<string | null>(null);

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
    setCompleteConfirmGameID(gameID);
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

  const createActionsForGame = (gameID: string) =>
    createGameActionHandlers({
      gameID,
      router,
      setError,
      setIsDeleting: (isDeleting) =>
        setDeletingGameID(isDeleting ? gameID : null),
      setIsWithdrawing: (isWithdrawing) =>
        setWithdrawingGameID(isWithdrawing ? gameID : null),
      setShowLeaveConfirm: (visible) => {
        if (!visible) setLeaveConfirmGameID(null);
      },
      setShowDeleteConfirm: (visible) => {
        if (!visible) setDeleteConfirmGameID(null);
      },
      onDeleteComplete: () => {
        setLocalGames((prev) => prev.filter((g) => g.gameID !== gameID));
      },
      onLeaveComplete: () => {
        setLocalGames((prev) => prev.filter((g) => g.gameID !== gameID));
      },
    });

  const leaveConfirmGame = localGames.find(
    (game) => game.gameID === leaveConfirmGameID,
  );
  const leaveConfirmActions = leaveConfirmGame
    ? createActionsForGame(leaveConfirmGame.gameID)
    : null;
  const isLeaveConfirmBusy = leaveConfirmGame
    ? withdrawingGameID === leaveConfirmGame.gameID
    : false;

  const deleteConfirmGame = localGames.find(
    (game) => game.gameID === deleteConfirmGameID,
  );
  const deleteConfirmActions = deleteConfirmGame
    ? createActionsForGame(deleteConfirmGame.gameID)
    : null;
  const isDeleteConfirmBusy = deleteConfirmGame
    ? deletingGameID === deleteConfirmGame.gameID
    : false;

  const completeConfirmGame = localGames.find(
    (game) => game.gameID === completeConfirmGameID,
  );
  const isCompleteConfirmBusy = completeConfirmGame
    ? actionLoading === `${completeConfirmGame.gameID}COMPLETED`
    : false;

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
          const isDeleting = deletingGameID === game.gameID;
          const isWithdrawing = withdrawingGameID === game.gameID;
          const actionsDisabled = busy || isDeleting || isWithdrawing;

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
                  {formatGameDateTime(new Date(game.dateTime))}
                </p>
                <p className="mt-1 text-xs text-[var(--up-muted)]">
                  {game.location}
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
                    Edit Game
                  </Link>
                  <button
                    onClick={() => handleComplete(game.gameID)}
                    disabled={actionsDisabled}
                    className="rounded-[10px] bg-[var(--up-accent)] px-3 py-2 text-sm font-medium text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)] disabled:opacity-50"
                  >
                    {actionLoading === game.gameID + "COMPLETED"
                      ? "Saving..."
                      : "Mark as Completed"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmGameID(game.gameID)}
                    disabled={actionsDisabled}
                    className="rounded-[10px] border border-[rgba(248,113,113,0.2)] bg-[var(--up-danger-bg)] px-3 py-2 text-sm font-medium text-[var(--up-danger)] transition hover:bg-[rgba(248,113,113,0.14)] disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete Game"}
                  </button>
                  <button
                    onClick={() => setLeaveConfirmGameID(game.gameID)}
                    disabled={actionsDisabled}
                    className="rounded-[10px] border border-[rgba(248,113,113,0.25)] px-3 py-2 text-sm font-medium text-[var(--up-danger)] transition hover:bg-[var(--up-danger-bg)] disabled:opacity-50"
                  >
                    {isWithdrawing ? "Leaving..." : "Leave Game"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {leaveConfirmGame && leaveConfirmActions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[18px] border border-[var(--up-border)] bg-[var(--up-surface)] p-6 shadow-2xl shadow-black/40">
            <h3 className="text-lg font-semibold">Leave this game?</h3>
            <p className="mt-2 text-sm text-[var(--up-muted)]">
              You will be removed from the participant list and lose your spot.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setLeaveConfirmGameID(null)}
                className="rounded-[10px] border border-[var(--up-border-mid)] px-4 py-2 text-sm font-medium text-[var(--up-text)] transition hover:bg-[var(--up-accent-bg)]"
              >
                Keep spot
              </button>
              <button
                type="button"
                onClick={leaveConfirmActions.handleLeave}
                className="rounded-[10px] bg-[var(--up-danger)] px-4 py-2 text-sm font-medium text-[#0b0f1a] transition hover:bg-[rgba(248,113,113,0.85)]"
                disabled={isLeaveConfirmBusy}
              >
                {isLeaveConfirmBusy ? "Leaving..." : "Leave game"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmGame && deleteConfirmActions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[18px] border border-[var(--up-border)] bg-[var(--up-surface)] p-6 shadow-2xl shadow-black/40">
            <h3 className="text-lg font-semibold">Delete this game?</h3>
            <p className="mt-2 text-sm text-[var(--up-muted)]">
              It will be permanently removed from the platform.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmGameID(null)}
                className="rounded-[10px] border border-[var(--up-border-mid)] px-4 py-2 text-sm font-medium text-[var(--up-text)] transition hover:bg-[var(--up-accent-bg)]"
              >
                Keep game
              </button>
              <button
                type="button"
                onClick={deleteConfirmActions.handleDelete}
                className="rounded-[10px] bg-[var(--up-danger)] px-4 py-2 text-sm font-medium text-[#0b0f1a] transition hover:bg-[rgba(248,113,113,0.85)]"
                disabled={isDeleteConfirmBusy}
              >
                {isDeleteConfirmBusy ? "Deleting..." : "Delete game"}
              </button>
            </div>
          </div>
        </div>
      )}

      {completeConfirmGame && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[18px] border border-[var(--up-border)] bg-[var(--up-surface)] p-6 shadow-2xl shadow-black/40">
            <h3 className="text-lg font-semibold">Mark this game as completed?</h3>
            <p className="mt-2 text-sm text-[var(--up-muted)]">
              This will finalize the game and close participation.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompleteConfirmGameID(null)}
                className="rounded-[10px] border border-[var(--up-border-mid)] px-4 py-2 text-sm font-medium text-[var(--up-text)] transition hover:bg-[var(--up-accent-bg)]"
              >
                Keep game
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!completeConfirmGame) return;
                  setCompleteConfirmGameID(null);
                  patchStatus(completeConfirmGame.gameID, "COMPLETED");
                }}
                className="rounded-[10px] bg-[var(--up-accent)] px-4 py-2 text-sm font-medium text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)]"
                disabled={isCompleteConfirmBusy}
              >
                {isCompleteConfirmBusy ? "Saving..." : "Mark completed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
