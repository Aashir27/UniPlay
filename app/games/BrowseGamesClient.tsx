"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Game } from "@prisma/client";

interface BrowseGamesClientProps {
  initialGames: Game[];
}

export default function BrowseGamesClient({
  initialGames,
}: BrowseGamesClientProps) {
  const router = useRouter();

  const [sportFilter, setSportFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside the search container
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

  // Suggestions from all loaded games, ignoring sport/skill dropdowns
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

  // Main game list: all three filters combined
  const filteredGames = useMemo(() => {
    return initialGames.filter((game) => {
      if (sportFilter && game.sport !== sportFilter) return false;
      if (skillFilter && game.skillLevel !== skillFilter) return false;
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
  }, [initialGames, sportFilter, skillFilter, keyword]);

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

  function handleSuggestionClick(gameID: string) {
    router.push(`/games/${gameID}`);
    setShowDropdown(false);
  }

  function clearKeyword() {
    setKeyword("");
    setShowDropdown(false);
    setActiveIdx(-1);
  }

  const skillLabel = (level: string) =>
    level === "BEGINNER"
      ? "Beginner"
      : level === "INTERMEDIATE"
        ? "Intermediate"
        : "Advanced";

  return (
    <div className="space-y-6">
      {/* Keyword search */}
      <div ref={searchRef} className="relative">
        <div className="flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-2 focus-within:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900">
          {/* Magnifying glass icon */}
          <svg
            className="mr-2 h-4 w-4 shrink-0 text-zinc-400"
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
            placeholder="Search by sport, location, or skill level…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
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
              className="ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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

        {/* Dropdown suggestions */}
        {showDropdown && keyword.trim() && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {suggestions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                No games match your search.
              </p>
            ) : (
              <ul>
                {suggestions.map((game, idx) => {
                  const isFull = game.currentCount >= game.maxParticipants;
                  return (
                    <li key={game.gameID}>
                      <button
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                          idx === activeIdx
                            ? "bg-blue-50 dark:bg-zinc-800"
                            : ""
                        } ${idx !== suggestions.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""}`}
                        onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                        onClick={() => handleSuggestionClick(game.gameID)}
                        onMouseEnter={() => setActiveIdx(idx)}
                      >
                        <div className="min-w-0">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {game.sport}
                          </span>
                          <span className="mx-1 text-zinc-300 dark:text-zinc-600">
                            ·
                          </span>
                          <span className="truncate text-zinc-500 dark:text-zinc-400">
                            {game.location}
                          </span>
                        </div>
                        <div className="ml-4 flex shrink-0 items-center gap-2">
                          <span className="text-xs text-zinc-400">
                            {game.currentCount}/{game.maxParticipants}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                              isFull
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
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

      {/* Sport & skill filters */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sport" className="block text-sm font-medium">
              Sport
            </label>
            <select
              id="sport"
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">None - Show All Sports</option>
              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="skillLevel" className="block text-sm font-medium">
              Skill Level
            </label>
            <select
              id="skillLevel"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">None - Show All Levels</option>
              {skillLevels.map((level) => (
                <option key={level} value={level}>
                  {skillLabel(level)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Game grid */}
      {filteredGames.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">
            No games match your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredGames.map((game) => {
            const isFull = game.currentCount >= game.maxParticipants;
            return (
              <Link
                key={game.gameID}
                href={`/games/${game.gameID}`}
                className="group rounded-lg border border-zinc-200 p-4 transition hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold group-hover:text-blue-600">
                    {game.sport}
                  </h3>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      isFull
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}
                  >
                    {isFull ? "Closed" : "Open"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(game.dateTime).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  {game.location}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {game.currentCount}/{game.maxParticipants} participants
                  </span>
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {skillLabel(game.skillLevel)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
