"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [sportFilter, setSportFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const suggestions = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return [];
    return initialGames
      .filter(
        (g) =>
          g.sport.toLowerCase().includes(k) ||
          g.location.toLowerCase().includes(k) ||
          g.skillLevel.toLowerCase().includes(k),
      )
      .slice(0, 6);
  }, [initialGames, keyword]);

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
          } else if (
            gameMinutes < startMinutes &&
            gameMinutes > endMinutes
          ) {
            return false;
          }
        } else if (startMinutes !== null && gameMinutes < startMinutes) {
          return false;
        } else if (endMinutes !== null && gameMinutes > endMinutes) {
          return false;
        }
      }
      if (keyword.trim()) {
        const k = keyword.trim().toLowerCase();
        if (
          !game.sport.toLowerCase().includes(k) &&
          !game.location.toLowerCase().includes(k) &&
          !game.skillLevel.toLowerCase().includes(k)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [initialGames, sportFilter, skillFilter, timeFrom, timeTo, dateFilter, keyword]);

  const sports = [
    "Cricket",
    "Football",
    "Basketball",
    "Tennis",
    "Volleyball",
    "Table Tennis",
  ];
  const skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        router.push(`/games/${suggestions[activeIdx].gameID}`);
        setShowDropdown(false);
      }
    } else if (e.key === "Escape") {
      setKeyword("");
      setShowDropdown(false);
      setActiveIdx(-1);
    }
  }

  function clearKeyword() {
    setKeyword("");
    setShowDropdown(false);
    setActiveIdx(-1);
  }

  function clearAllFilters() {
    setSportFilter("");
    setSkillFilter("");
    setTimeFrom("");
    setTimeTo("");
    setDateFilter("");
    setKeyword("");
    setShowDropdown(false);
    setActiveIdx(-1);
  }

  const hasActiveFilters =
    sportFilter ||
    skillFilter ||
    timeFrom ||
    timeTo ||
    dateFilter ||
    keyword.trim();

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
      {/* Keyword search */}
      <div ref={searchRef} className="relative">
        <div className="flex items-center rounded-lg border border-[var(--up-border-mid)] bg-[var(--up-surface)] px-3 py-2 focus-within:border-[rgba(163,230,53,0.45)]">
          <svg
            className="mr-2 h-4 w-4 shrink-0 text-[var(--up-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={keyword}
            placeholder="Search by sport, skill level, date or time"
            className="flex-1 bg-transparent text-sm text-[var(--up-text)] outline-none placeholder:text-[var(--up-muted)]"
            onChange={(e) => {
              setKeyword(e.target.value);
              setActiveIdx(-1);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (keyword.trim()) setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {keyword && (
            <button
              onClick={clearKeyword}
              aria-label="Clear search"
              className="ml-2 text-[var(--up-muted)] hover:text-[var(--up-text)]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {showDropdown && keyword.trim() && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--up-border)] bg-[var(--up-surface)] shadow-2xl shadow-black/20">
            {suggestions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[var(--up-muted)]">
                No games match your search.
              </p>
            ) : (
              <ul>
                {suggestions.map((game, idx) => {
                  const isFull = game.currentCount >= game.maxParticipants;
                  return (
                    <li key={game.gameID}>
                      <button
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-[var(--up-accent-bg)] ${
                          idx === activeIdx ? "bg-[var(--up-accent-bg)]" : ""
                        } ${idx !== suggestions.length - 1 ? "border-b border-[var(--up-border)]" : ""}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          router.push(`/games/${game.gameID}`);
                          setShowDropdown(false);
                        }}
                        onMouseEnter={() => setActiveIdx(idx)}
                      >
                        <div className="min-w-0">
                          <span className="font-medium text-[var(--up-text)]">
                            {game.sport}
                          </span>
                          <span className="mx-1 text-[var(--up-muted)]">
                            ·
                          </span>
                          <span className="truncate text-[var(--up-muted)]">
                            {game.location}
                          </span>
                        </div>
                        <div className="ml-4 flex shrink-0 items-center gap-2">
                          <span className="text-xs text-[var(--up-muted)]">
                            {game.currentCount}/{game.maxParticipants}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                              isFull
                                ? "border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] text-[var(--up-muted)]"
                                : "border border-[rgba(163,230,53,0.25)] bg-[var(--up-accent-bg)] text-[var(--up-accent)]"
                            }`}
                          >
                            {isFull ? "Full" : "Open"}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

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
          <p className="text-[var(--up-muted)]">
            No games match your filters.
          </p>
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
                <p className="mt-1 text-xs text-[var(--up-muted)]">{game.location}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-[var(--up-muted)]">
                  <span>{game.currentCount}/{game.maxParticipants} participants</span>
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
