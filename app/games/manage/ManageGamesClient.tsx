"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Game } from "@prisma/client";
import { formatGameDateTime } from "@/lib/formatTime";
import { createGameActionHandlers } from "@/src/components/games/gameActions";

interface ManageGamesClientProps {
  createdGames: Game[];
  joinedGames: Game[];
  historyGames: Game[];
  joinedHistoryGames: Game[];
}

export default function ManageGamesClient({
  createdGames,
  joinedGames,
  historyGames,
  joinedHistoryGames,
}: ManageGamesClientProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localCreatedGames, setLocalCreatedGames] = useState(createdGames);
  const [localJoinedGames, setLocalJoinedGames] = useState(joinedGames);
  const [localHistoryGames, setLocalHistoryGames] = useState([
    ...historyGames,
    ...joinedHistoryGames,
  ]);
  const [deletingGameID, setDeletingGameID] = useState<string | null>(null);
  const [withdrawingGameID, setWithdrawingGameID] = useState<string | null>(
    null,
  );
  const [leaveConfirmGameID, setLeaveConfirmGameID] = useState<string | null>(
    null,
  );
  const [deleteConfirmGameID, setDeleteConfirmGameID] = useState<string | null>(
    null,
  );
  const [completeConfirmGameID, setCompleteConfirmGameID] = useState<
    string | null
  >(null);

  async function patchStatus(
    gameID: string,
    status: "COMPLETED" | "CANCELLED",
  ) {
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

      const gameToMove = localCreatedGames.find((g) => g.gameID === gameID);
      if (status === "COMPLETED" && gameToMove) {
        const completedGame = { ...gameToMove, status };
        setLocalCreatedGames((prev) =>
          prev.filter((g) => g.gameID !== gameID),
        );
        setLocalHistoryGames((prev) => [completedGame, ...prev]);
      } else {
        setLocalCreatedGames((prev) =>
          prev.map((g) => (g.gameID === gameID ? { ...g, status } : g)),
        );
      }
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
      DRAFT:
        "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]",
      OPEN: "border border-[rgba(163,230,53,0.25)] bg-[var(--up-accent-bg)] text-[var(--up-accent)]",
      FULL: "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]",
      CANCELLED:
        "border border-[rgba(248,113,113,0.2)] bg-[var(--up-danger-bg)] text-[var(--up-danger)]",
      COMPLETED:
        "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]",
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

  const createActionsForGame = (gameID: string, isJoined: boolean = false) =>
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
        setLocalCreatedGames((prev) => prev.filter((g) => g.gameID !== gameID));
      },
      onLeaveComplete: () => {
        if (isJoined) {
          setLocalJoinedGames((prev) =>
            prev.filter((g) => g.gameID !== gameID),
          );
        } else {
          setLocalCreatedGames((prev) =>
            prev.filter((g) => g.gameID !== gameID),
          );
        }
      },
    });

  const leaveConfirmGame = [...localCreatedGames, ...localJoinedGames].find(
    (game) => game.gameID === leaveConfirmGameID,
  );
  const isJoinedGame = leaveConfirmGame
    ? localJoinedGames.some((g) => g.gameID === leaveConfirmGame.gameID)
    : false;
  const leaveConfirmActions = leaveConfirmGame
    ? createActionsForGame(leaveConfirmGame.gameID, isJoinedGame)
    : null;
  const isLeaveConfirmBusy = leaveConfirmGame
    ? withdrawingGameID === leaveConfirmGame.gameID
    : false;

  const deleteConfirmGame = localCreatedGames.find(
    (game) => game.gameID === deleteConfirmGameID,
  );
  const deleteConfirmActions = deleteConfirmGame
    ? createActionsForGame(deleteConfirmGame.gameID, false)
    : null;
  const isDeleteConfirmBusy = deleteConfirmGame
    ? deletingGameID === deleteConfirmGame.gameID
    : false;

  const completeConfirmGame = localCreatedGames.find(
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

      {/* Games You Created Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Games You Created</h2>
        {localCreatedGames.length === 0 ? (
          <div className="rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-6 text-center">
            <p className="text-sm text-[var(--up-muted)]">
              You haven&apos;t created any games yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {localCreatedGames.map((game) => {
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
        )}
      </div>

      {/* Games You've Joined Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Games You&apos;ve Joined</h2>
        {localJoinedGames.length === 0 ? (
          <div className="rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-6 text-center">
            <p className="text-sm text-[var(--up-muted)]">
              You haven&apos;t joined any games yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {localJoinedGames.map((game) => {
              const isWithdrawing = withdrawingGameID === game.gameID;

              return (
                <div
                  key={game.gameID}
                  className="flex flex-col gap-3 rounded-[20px] border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] p-4 sm:flex-row sm:items-center sm:justify-between"
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

                  <div className="flex gap-2">
                    <button
                      onClick={() => setLeaveConfirmGameID(game.gameID)}
                      disabled={isWithdrawing}
                      className="rounded-[10px] border border-[rgba(248,113,113,0.25)] px-3 py-2 text-sm font-medium text-[var(--up-danger)] transition hover:bg-[var(--up-danger-bg)] disabled:opacity-50"
                    >
                      {isWithdrawing ? "Leaving..." : "Leave Game"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">History</h2>
        {localHistoryGames.length === 0 ? (
          <div className="rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-6 text-center">
            <p className="text-sm text-[var(--up-muted)]">
              No completed games yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {localHistoryGames.map((game) => (
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
              </div>
            ))}
          </div>
        )}
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
            <h3 className="text-lg font-semibold">
              Mark this game as completed?
            </h3>
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
