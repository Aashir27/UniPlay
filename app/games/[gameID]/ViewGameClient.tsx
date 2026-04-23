"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@prisma/client";

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
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(initialHasJoined);

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
      setHasJoined(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("Withdraw from this game?")) return;
    setIsWithdrawing(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${game.gameID}/withdraw`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to withdraw");
        return;
      }
      setHasJoined(false);
      router.refresh();
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
        "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200",
      description: "This game is actively accepting participants.",
    },
    FULL: {
      label: "Full",
      badge:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200",
      description: "All spots are taken. Withdraw becomes available if someone leaves.",
    },
    CANCELLED: {
      label: "Cancelled",
      badge: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200",
      description: "This game has been cancelled by the organizer.",
    },
    COMPLETED: {
      label: "Completed",
      badge:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
      description: "This game has already been played.",
    },
    DRAFT: {
      label: "Draft",
      badge:
        "bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-200",
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
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{game.sport}</h1>
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${cfg.badge}`}
        >
          {cfg.label}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">{cfg.description}</p>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Organised by{" "}
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          {game.creator?.name || game.creator?.email}
        </span>
      </p>

      {/* Details card */}
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Date &amp; Time
            </p>
            <p className="mt-1 font-semibold">
              {new Date(game.dateTime).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Location
            </p>
            <p className="mt-1 font-semibold">{game.location}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Skill Level
            </p>
            <p className="mt-1 font-semibold">{skillLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Participants
            </p>
            <p className="mt-1 font-semibold">
              {game.currentCount} / {game.maxParticipants}
            </p>
          </div>
        </div>
      </div>

      {/* Participant list */}
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="mb-4 text-base font-semibold">
          Participants ({game.participations.length}/{game.maxParticipants})
        </h2>
        {game.participations.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No participants yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {game.participations.map((p) => {
              const isHost = p.userID === game.creatorID;
              const isMe = p.userID === currentUserID;
              return (
                <li
                  key={p.userID}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2.5 dark:bg-zinc-900"
                >
                  <span className="text-sm font-medium">
                    {p.user.name || p.user.email}
                    {isMe && (
                      <span className="ml-2 text-xs text-zinc-400">(you)</span>
                    )}
                  </span>
                  {isHost && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      Organiser
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {isCreator && (
          <a
            href={`/games/${game.gameID}/edit`}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Edit Game
          </a>
        )}
        {isCreator && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Game"}
          </button>
        )}
        {!isCreator && isOpen && !hasJoined && (
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isJoining ? "Joining..." : "Join Game"}
          </button>
        )}
        {!isCreator && isFull && !hasJoined && (
          <button
            disabled
            className="rounded-lg bg-gray-400 px-4 py-2 font-medium text-white cursor-not-allowed"
          >
            Game Full
          </button>
        )}
        {!isCreator && hasJoined && isActive && (
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing}
            className="rounded-lg border border-orange-500 px-4 py-2 font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 disabled:opacity-50"
          >
            {isWithdrawing ? "Withdrawing..." : "Withdraw"}
          </button>
        )}
        <a
          href="/games"
          className="rounded-lg border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Back to Games
        </a>
      </div>
    </>
  );
}
