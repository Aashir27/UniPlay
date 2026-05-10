"use client";

import Link from "next/link";
import { formatGameTime } from "@/lib/formatTime";

type DashboardGame = {
  gameID: string;
  sport: string;
  location: string;
  dateTime: string;
  skillLevel: string;
  currentCount: number;
  maxParticipants: number;
  status: string;
};

const SPORT_EMOJI: Record<string, string> = {
  Cricket: "🏏",
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Volleyball: "🏐",
  "Table Tennis": "🏓",
};

export function DashboardClient({
  userName,
  stats,
  openGames,
}: {
  userName: string;
  stats: {
    gamesJoined: number;
    gamesHosted: number;
    sportsActive: number;
    notifications: number;
  };
  openGames: DashboardGame[];
}) {
  const statCards = [
    { label: "Games joined", value: stats.gamesJoined, icon: <JoinIcon /> },
    { label: "Games hosted", value: stats.gamesHosted, icon: <HostIcon /> },
    { label: "Sports active", value: stats.sportsActive, icon: <SportIcon /> },
    { label: "Notifications", value: stats.notifications, icon: <BellIcon /> },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 sm:px-8 lg:px-6 lg:py-8">
      <section className="overflow-hidden rounded-[28px] border border-[var(--up-border)] bg-[var(--up-surface)] shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="max-w-3xl space-y-3">
            <h1 className="font-[family:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-[var(--up-accent)]">Hi</span>, {userName}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[var(--up-muted)] sm:text-base">
              Manage your profile, browse games, post new sessions, and keep
              track of your sports activity from this hub.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-[var(--up-border)] bg-[var(--up-surface)] p-5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--up-accent-bg)] text-[var(--up-accent)]">
              {stat.icon}
            </div>
            <p className="mt-4 font-[family:var(--font-display)] text-3xl font-bold tracking-tight">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-[var(--up-muted)]">
              {stat.label}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[28px] border border-[var(--up-border)] bg-[var(--up-surface)] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-[family:var(--font-display)] text-lg font-bold tracking-tight">
              Open games
            </h2>
            <p className="mt-1 text-sm text-[var(--up-muted)]">
              Browse the latest games near you.
            </p>
          </div>
          <Link href="/games" className="text-sm font-medium text-[var(--up-accent)]">
            See all →
          </Link>
        </div>

        <div className="space-y-3">
          {openGames.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--up-muted)]">
              No open games right now.
            </p>
          ) : (
            openGames.map((game) => {
              const isFull = game.currentCount >= game.maxParticipants;
              const skillLabel =
                game.skillLevel === "BEGINNER"
                  ? "Beginner"
                  : game.skillLevel === "INTERMEDIATE"
                    ? "Intermediate"
                    : "Advanced";
              const time = formatGameTime(new Date(game.dateTime));
              return (
                <Link key={game.gameID} href={`/games/${game.gameID}`}>
                  <GameRow
                    sport={game.sport}
                    emoji={SPORT_EMOJI[game.sport] ?? "🏅"}
                    location={game.location}
                    time={time}
                    skill={skillLabel}
                    count={`${game.currentCount}/${game.maxParticipants}`}
                    open={!isFull}
                  />
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function GameRow({
  sport,
  emoji,
  location,
  time,
  skill,
  count,
  open = false,
}: {
  sport: string;
  emoji: string;
  location: string;
  time: string;
  skill: string;
  count: string;
  open?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-[var(--up-border)] bg-[var(--up-surface-2)] p-4">
      <div className="text-lg">{emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{sport}</p>
          <span
            className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold ${
              open
                ? "border-[rgba(163,230,53,0.2)] bg-[var(--up-accent-bg)] text-[var(--up-accent)]"
                : "border-[rgba(248,113,113,0.2)] bg-[var(--up-danger-bg)] text-[var(--up-danger)]"
            }`}
          >
            {open ? "Open" : "Full"}
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--up-muted)]">
          {location} · {time} · {skill}
        </p>
      </div>
      <div className="text-right text-xs text-[var(--up-muted)]">{count}</div>
    </div>
  );
}


function BellIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function HostIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function SportIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0-6.88 17.22M12 2a10 10 0 0 1 6.88 17.22" />
      <line x1="2.05" y1="12" x2="21.95" y2="12" />
    </svg>
  );
}

function JoinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

