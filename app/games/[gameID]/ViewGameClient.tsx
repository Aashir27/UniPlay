"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Game } from "@prisma/client";
import { formatGameDateTime } from "@/lib/formatTime";

type Participant = {
  userID: string;
  status: string;
  joinedAt: string | Date;
  user: { userID: string; name: string | null; email: string };
};

interface ViewGameClientProps {
  game: Game & {
    creator: { userID: string; name: string | null; email: string } | null;
    participations: Participant[];
  };
  isCreator: boolean;
  currentUserID: string | null;
  hasJoined: boolean;
}

export default function ViewGameClient({
  game,
  isCreator,
  currentUserID,
  hasJoined: initialHasJoined,
}: ViewGameClientProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const hasJoined = initialHasJoined;

  const isFull =
    game.status === "FULL" || game.currentCount >= game.maxParticipants;
  const isOpen = game.status === "OPEN" && !isFull;
  const isActive = game.status === "OPEN" || game.status === "FULL";

  const handleJoin = async () => {
    if (!currentUserID) {
      router.push("/login");
      return;
    }
    setIsJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${game.gameID}/join`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to join game");
        return;
      }
      // Navigate to the same page to force a full server component re-render.
      router.push(`/games/${game.gameID}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setShowLeaveConfirm(false);
    setIsWithdrawing(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${game.gameID}/withdraw`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to leave game");
        return;
      }
      router.push(`/games/${game.gameID}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Delete this game? It will be permanently removed from the platform.",
      )
    )
      return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${game.gameID}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete game");
        return;
      }
      router.push("/games");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const statusConfig: Record<
    string,
    { label: string; badge: string; description: string }
  > = {
    OPEN: {
      label: "Open",
      badge:
        "border border-[rgba(163,230,53,0.25)] bg-[var(--up-accent-bg)] text-[var(--up-accent)]",
      description: "This game is actively accepting participants.",
    },
    FULL: {
      label: "Full",
      badge:
        "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]",
      description: "All spots are taken. A spot opens if someone leaves.",
    },
    CANCELLED: {
      label: "Cancelled",
      badge: "border border-[rgba(248,113,113,0.2)] bg-[var(--up-danger-bg)] text-[var(--up-danger)]",
      description: "This game has been cancelled.",
    },
    COMPLETED: {
      label: "Completed",
      badge:
        "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]",
      description: "This game has already been played.",
    },
    DRAFT: {
      label: "Draft",
      badge:
        "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]",
      description: "This game is not yet published.",
    },
  };

  const status = isFull && game.status === "OPEN" ? "FULL" : game.status;
  const cfg = statusConfig[status] ?? statusConfig["DRAFT"];

  const skillLabel =
    game.skillLevel === "BEGINNER"
      ? "Beginner"
      : game.skillLevel === "INTERMEDIATE"
        ? "Intermediate"
        : "Advanced";

  return (
    <>
      {error && (
        <div className="rounded-lg border border-[rgba(248,113,113,0.18)] bg-[var(--up-danger-bg)] p-4 text-sm text-[var(--up-danger)]">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[28px] border border-[var(--up-border)] bg-[var(--up-surface)] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-[family:var(--font-display)] text-3xl font-bold tracking-tight">
            {game.sport}
          </h1>
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <p className="mt-3 text-sm text-[var(--up-muted)]">{cfg.description}</p>
        <p className="mt-3 text-sm text-[var(--up-muted)]">
          Created by{" "}
          <span className="font-medium text-[var(--up-text)]">
            {game.creator?.name || game.creator?.email}
          </span>
        </p>
      </section>

      <div className="rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--up-muted)]">
              Date &amp; Time
            </p>
            <p className="mt-1 font-semibold">
              {formatGameDateTime(new Date(game.dateTime))}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--up-muted)]">
              Location
            </p>
            <p className="mt-1 font-semibold">{game.location}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--up-muted)]">
              Skill Level
            </p>
            <p className="mt-1 font-semibold">{skillLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--up-muted)]">
              Participants
            </p>
            <p className="mt-1 font-semibold">
              {game.currentCount} / {game.maxParticipants}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowParticipants((visible) => !visible)}
          className="rounded-[10px] border border-[var(--up-border-mid)] px-4 py-2 font-medium text-[var(--up-text)] transition hover:border-[rgba(163,230,53,0.25)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
        >
          {showParticipants ? "Hide Participants" : "View Participants"}
        </button>

        {showParticipants && (
          <div className="rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-6">
            <h2 className="mb-4 text-base font-semibold">
              Participants ({game.participations.length}/{game.maxParticipants})
            </h2>
            {game.participations.length === 0 ? (
              <p className="text-sm text-[var(--up-muted)]">
                No participants yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {game.participations.map((p) => {
                  const isMe = p.userID === currentUserID;
                  return (
                    <li
                      key={p.userID}
                      className="flex items-center justify-between rounded-[12px] border border-[var(--up-border)] bg-[var(--up-surface-2)] px-4 py-2.5"
                    >
                      <span className="text-sm font-medium">
                        {p.user.name || p.user.email}
                        {isMe && (
                          <span className="ml-2 text-xs text-[var(--up-muted)]">(you)</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {isCreator && (
          <Link
            href={`/games/${game.gameID}/edit`}
            className="rounded-[10px] bg-[var(--up-accent)] px-4 py-2 font-medium text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)]"
          >
            Edit Game
          </Link>
        )}
        {isCreator && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-[10px] border border-[rgba(248,113,113,0.2)] bg-[var(--up-danger-bg)] px-4 py-2 font-medium text-[var(--up-danger)] transition hover:bg-[rgba(248,113,113,0.14)] disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Game"}
          </button>
        )}
        {isOpen && !hasJoined && (
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="rounded-[10px] bg-[var(--up-accent)] px-4 py-2 font-medium text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)] disabled:opacity-50"
          >
            {isJoining ? "Joining..." : "Join Game"}
          </button>
        )}
        {isFull && !hasJoined && (
          <button
            disabled
            className="cursor-not-allowed rounded-[10px] border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] px-4 py-2 font-medium text-[var(--up-muted)]"
          >
            Game Full
          </button>
        )}
        {hasJoined && isActive && (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            disabled={isWithdrawing}
            className="rounded-[10px] border border-[rgba(248,113,113,0.25)] px-4 py-2 font-medium text-[var(--up-danger)] transition hover:bg-[var(--up-danger-bg)] disabled:opacity-50"
          >
            {isWithdrawing ? "Leaving..." : "Leave Game"}
          </button>
        )}
        <Link
          href="/games"
          className="rounded-[10px] border border-[var(--up-border-mid)] px-4 py-2 font-medium text-[var(--up-text)] transition hover:border-[rgba(163,230,53,0.25)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
        >
          Back to Games
        </Link>
      </div>

      {showLeaveConfirm && (
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
                onClick={() => setShowLeaveConfirm(false)}
                className="rounded-[10px] border border-[var(--up-border-mid)] px-4 py-2 text-sm font-medium text-[var(--up-text)] transition hover:bg-[var(--up-accent-bg)]"
              >
                Keep spot
              </button>
              <button
                type="button"
                onClick={handleLeave}
                className="rounded-[10px] bg-[var(--up-danger)] px-4 py-2 text-sm font-medium text-[#0b0f1a] transition hover:bg-[rgba(248,113,113,0.85)]"
              >
                Leave game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
