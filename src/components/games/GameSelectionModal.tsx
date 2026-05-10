"use client";

import { useEffect, useState } from "react";
import { formatGameTime } from "@/lib/formatTime";

type Game = {
  gameID: string;
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

export function GameSelectionModal({
  onClose,
  onSelect,
  isLoading,
}: {
  onClose: () => void;
  onSelect: (gameID: string) => void;
  isLoading: boolean;
}) {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameID, setSelectedGameID] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      try {
        const res = await fetch("/api/games/my-games", { method: "GET" });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Failed to load games");
          return;
        }

        setGames(data.games ?? []);
      } catch {
        setError("Failed to load games");
      } finally {
        setLoading(false);
      }
    }

    void loadGames();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-2xl border border-[var(--up-border)] bg-[var(--up-surface)] p-6 shadow-2xl w-full max-w-md">
          <p className="text-sm text-[var(--up-muted)]">
            Loading your games...
          </p>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    if (selectedGameID) {
      onSelect(selectedGameID);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-2xl border border-[var(--up-border)] bg-[var(--up-surface)] shadow-2xl w-full max-w-md max-h-96 flex flex-col">
        <div className="p-6 border-b border-[var(--up-border)]">
          <h2 className="font-[family:var(--font-display)] text-lg font-bold">
            Select a game to invite to
          </h2>
          <p className="mt-1 text-sm text-[var(--up-muted)]">
            Choose from games you&apos;ve joined
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="rounded-lg border border-[rgba(248,113,113,0.18)] bg-[var(--up-danger-bg)] p-3 text-sm text-[var(--up-danger)]">
              {error}
            </div>
          )}

          {!error && games.length === 0 && (
            <p className="text-center text-sm text-[var(--up-muted)] py-8">
              You haven&apos;t joined any games yet.
            </p>
          )}

          {!error && games.length > 0 && (
            <div className="space-y-2">
              {games.map((game) => (
                <label
                  key={game.gameID}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition"
                  style={{
                    borderColor:
                      selectedGameID === game.gameID
                        ? "var(--up-accent)"
                        : "var(--up-border)",
                    backgroundColor:
                      selectedGameID === game.gameID
                        ? "var(--up-accent-bg)"
                        : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="game-selection"
                    value={game.gameID}
                    checked={selectedGameID === game.gameID}
                    onChange={(e) => setSelectedGameID(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {SPORT_EMOJI[game.sport] ?? "🏅"}
                      </span>
                      <p className="text-sm font-medium">{game.sport}</p>
                    </div>
                    <p className="text-xs text-[var(--up-muted)] mt-1">
                      {game.location} ·{" "}
                      {formatGameTime(new Date(game.dateTime))}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--up-border)] p-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--up-border-mid)] px-4 py-2 text-sm font-medium text-[var(--up-text)] transition hover:bg-[var(--up-surface-2)]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedGameID || isLoading}
            className="rounded-lg bg-[var(--up-accent)] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
