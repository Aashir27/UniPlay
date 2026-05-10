"use client";

import { useState } from "react";
import { formatGameTime } from "@/lib/formatTime";

type NotificationData = {
  notifID: string;
  type: string;
  message: string;
  relatedGameID?: string;
  createdAt: string;
  isRead: boolean;
};

type GameData = {
  sport: string;
  dateTime: string;
  location: string;
  skillLevel: string;
};

const SPORT_EMOJI: Record<string, string> = {
  Cricket: "🏏",
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Volleyball: "🏐",
  "Table Tennis": "🏓",
  Foosball: "⚽",
  Swimming: "🏊",
};

export function NotificationCard({
  notification,
  game,
  onActionComplete,
}: {
  notification: NotificationData;
  game?: GameData;
  onActionComplete?: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGameInvite = notification.type === "GAME_INVITE";

  const handleAction = async (action: "accept" | "decline") => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/notifications/${notification.notifID}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to process action");
        return;
      }

      onActionComplete?.();
    } catch {
      setError("Failed to process action");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--up-border)] bg-[var(--up-surface-2)] p-4">
      <div className="flex items-start gap-3">
        {isGameInvite && game && (
          <span className="text-2xl">{SPORT_EMOJI[game.sport] ?? "🏅"}</span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--up-text)]">
            {notification.message}
          </p>
          {isGameInvite && game && (
            <p className="mt-2 text-xs text-[var(--up-muted)]">
              {game.location} · {formatGameTime(new Date(game.dateTime))} ·{" "}
              {game.skillLevel === "BEGINNER"
                ? "Beginner"
                : game.skillLevel === "INTERMEDIATE"
                  ? "Intermediate"
                  : "Advanced"}
            </p>
          )}

          {error && (
            <p className="mt-2 text-xs text-[var(--up-danger)]">{error}</p>
          )}

          {isGameInvite && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleAction("accept")}
                disabled={isProcessing}
                className="rounded-md bg-[var(--up-accent)] px-3 py-1.5 text-xs font-medium text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Accept"}
              </button>
              <button
                onClick={() => handleAction("decline")}
                disabled={isProcessing}
                className="rounded-md border border-[var(--up-border-mid)] px-3 py-1.5 text-xs font-medium text-[var(--up-text)] transition hover:bg-[var(--up-surface)] disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
