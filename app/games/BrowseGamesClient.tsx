"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Game } from "@prisma/client";
import { Select } from "@/src/components/ui/Select";
import { formatGameDateTime } from "@/lib/formatTime";

interface BrowseGamesClientProps {
  initialGames: Game[];
}

const parseTimeToMinutes = (value: string): number | null => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

export default function BrowseGamesClient({
  initialGames,
}: BrowseGamesClientProps) {
  const [sportFilter, setSportFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filteredGames = useMemo(() => {
    const startMinutes = parseTimeToMinutes(timeFrom);
    const endMinutes = parseTimeToMinutes(timeTo);

    return initialGames.filter((game) => {
      if (sportFilter && game.sport !== sportFilter) return false;
      if (skillFilter && game.skillLevel !== skillFilter) return false;
      if (dateFilter) {
        const gameDate = new Date(game.dateTime).toISOString().slice(0, 10);
        if (gameDate !== dateFilter) return false;
      }
      if (startMinutes !== null || endMinutes !== null) {
        const gameDate = new Date(game.dateTime);
        const gameMinutes = gameDate.getHours() * 60 + gameDate.getMinutes();

        if (startMinutes !== null && endMinutes !== null) {
          if (startMinutes <= endMinutes) {
            if (gameMinutes < startMinutes || gameMinutes > endMinutes)
              return false;
          } else if (gameMinutes < startMinutes && gameMinutes > endMinutes) {
            return false;
          }
        } else if (startMinutes !== null && gameMinutes < startMinutes) {
          return false;
        } else if (endMinutes !== null && gameMinutes > endMinutes) {
          return false;
        }
      }
      return true;
    });
  }, [initialGames, sportFilter, skillFilter, timeFrom, timeTo, dateFilter]);

  const sports = [
    "Cricket",
    "Football",
    "Basketball",
    "Tennis",
    "Volleyball",
    "Table Tennis",
    "Foosball",
    "Swimming",
  ];
  const skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

  function clearAllFilters() {
    setSportFilter("");
    setSkillFilter("");
    setTimeFrom("");
    setTimeTo("");
    setDateFilter("");
  }

  const hasActiveFilters =
    sportFilter || skillFilter || timeFrom || timeTo || dateFilter;

  const skillLabel = (level: string) =>
    level === "BEGINNER"
      ? "Beginner"
      : level === "INTERMEDIATE"
        ? "Intermediate"
        : "Advanced";

  const filterInputClass =
    "w-full rounded-[12px] border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] px-3 py-2 text-sm text-[var(--up-text)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(163,230,53,0.35)] hover:border-[rgba(163,230,53,0.35)] appearance-none [color-scheme:dark]";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg border border-[var(--up-border)] bg-[var(--up-surface)] p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="sport" className="block text-sm font-medium">
              Sport
            </label>
            <Select
              id="sport"
              value={sportFilter}
              onChange={setSportFilter}
              options={[
                { value: "", label: "All Sports" },
                ...sports.map((sport) => ({ value: sport, label: sport })),
              ]}
              className="mt-2"
              buttonClassName="text-sm"
              listClassName="text-sm"
            />
          </div>

          <div>
            <label htmlFor="skillLevel" className="block text-sm font-medium">
              Skill Level
            </label>
            <Select
              id="skillLevel"
              value={skillFilter}
              onChange={setSkillFilter}
              options={[
                { value: "", label: "All Levels" },
                ...skillLevels.map((level) => ({
                  value: level,
                  label: skillLabel(level),
                })),
              ]}
              className="mt-2"
              buttonClassName="text-sm"
              listClassName="text-sm"
            />
          </div>

          <div>
            <label htmlFor="timeFrom" className="block text-sm font-medium">
              Time Range
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                id="timeFrom"
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                aria-label="Start time"
                className={`${filterInputClass} min-w-[9.5rem] flex-1`}
              />
              <input
                id="timeTo"
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                aria-label="End time"
                className={`${filterInputClass} min-w-[9.5rem] flex-1`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`mt-2 ${filterInputClass}`}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="mt-4 text-sm text-[var(--up-accent)] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results */}
      {filteredGames.length === 0 ? (
        <div className="rounded-lg border border-[var(--up-border)] bg-[var(--up-surface)] p-8 text-center">
          <p className="text-[var(--up-muted)]">No games match your filters.</p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-3 text-sm text-[var(--up-accent)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredGames.map((game) => {
            const isFull = game.currentCount >= game.maxParticipants;
            return (
              <Link
                key={game.gameID}
                href={`/games/${game.gameID}`}
                className="group rounded-lg border border-[var(--up-border)] bg-[var(--up-surface)] p-4 transition hover:border-[rgba(163,230,53,0.35)] hover:bg-[var(--up-accent-bg)]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold group-hover:text-[var(--up-accent)]">
                    {game.sport}
                  </h3>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      isFull
                        ? "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]"
                        : "border border-[rgba(163,230,53,0.25)] bg-[var(--up-accent-bg)] text-[var(--up-accent)]"
                    }`}
                  >
                    {isFull ? "Full" : "Open"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--up-muted)]">
                  {formatGameDateTime(new Date(game.dateTime))}
                </p>
                <p className="mt-1 text-xs text-[var(--up-muted)]">
                  {game.location}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-[var(--up-muted)]">
                  <span>
                    {game.currentCount}/{game.maxParticipants} participants
                  </span>
                  <span>{skillLabel(game.skillLevel)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
