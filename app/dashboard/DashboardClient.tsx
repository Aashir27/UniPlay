"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export function DashboardClient({
  userName,
  userRole,
  userID,
}: {
  userName: string;
  userRole: string;
  userID: string;
}) {
  const router = useRouter();
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  const stats = [
    {
      label: "Games joined",
      value: "3",
      icon: <JoinIcon />,
    },
    {
      label: "Games hosted",
      value: userRole === "ORGANIZER" ? "2" : "0",
      icon: <HostIcon />,
    },
    {
      label: "Sports active",
      value: "4",
      icon: <SportIcon />,
    },
    {
      label: "Notifications",
      value: "5",
      icon: <BellIcon />,
    },
  ];

  const quickActions = [
    { href: "/profile", label: "Edit profile", icon: <UserIcon /> },
    {
      href: "/games/demo/edit",
      label: "Creator flow demo",
      icon: <PlusIcon />,
    },
    { href: "/dashboard", label: "Refresh dashboard", icon: <RefreshIcon /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--up-bg)] text-[var(--up-text)] lg:flex">
      <aside className="hidden border-r border-[var(--up-border)] bg-[var(--up-surface)] px-4 py-6 lg:flex lg:w-[220px] lg:flex-col">
        <div className="mb-7 flex items-center gap-2.5 px-2">
          <LogoMark />
        </div>

        <p className="mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--up-muted)]">
          Menu
        </p>
        <NavLink
          href="/dashboard"
          active
          icon={<HomeIcon />}
          label="Dashboard"
        />
        <NavLink href="/games" icon={<GamepadIcon />} label="Browse games" />
        <NavLink href="/profile" icon={<UserIcon />} label="My profile" />
        <NavLink
          href="/notifications"
          icon={<BellIcon />}
          label="Notifications"
        />

        {userRole === "ORGANIZER" ? (
          <>
            <p className="mb-2 mt-6 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--up-muted)]">
              Organizer
            </p>
            <NavLink
              href="/games/new"
              icon={<PlusIcon />}
              label="Post a game"
            />
            <NavLink
              href="/games/manage"
              icon={<ListIcon />}
              label="My games"
            />
          </>
        ) : null}

        <div className="mt-auto border-t border-[var(--up-border)] px-2 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(163,230,53,0.25)] bg-[var(--up-accent-bg)] text-[0.7rem] font-bold text-[var(--up-accent)]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.82rem] font-semibold">
                {userName}
              </p>
              <p className="text-[0.68rem] text-[var(--up-muted)]">
                {userRole.charAt(0) + userRole.slice(1).toLowerCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-[9px] border border-[var(--up-border-mid)] px-3 text-[0.78rem] font-medium text-[var(--up-muted)] transition hover:border-[rgba(163,230,53,0.25)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 sm:px-8 lg:px-6 lg:py-8">
          <section className="overflow-hidden rounded-[28px] border border-[var(--up-border)] bg-[var(--up-surface)] shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--up-accent)]">
                  Welcome back
                </p>
                <h1 className="font-[family:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
                  Hi, {userName}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-[var(--up-muted)] sm:text-base">
                  You’re signed in as a {userRole.toLowerCase()} and can manage
                  your profile, browse games, and keep track of your sports
                  activity from this hub.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/profile"
                  className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[var(--up-border-mid)] px-4 text-sm font-medium text-[var(--up-text)] transition hover:border-[rgba(163,230,53,0.25)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
                >
                  Edit profile
                </Link>
                <Link
                  href="/games/new"
                  className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[var(--up-accent)] px-4 text-sm font-bold text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)]"
                >
                  + Post a game
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
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

          <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
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
                <Link
                  href="/games"
                  className="text-sm font-medium text-[var(--up-accent)]"
                >
                  See all →
                </Link>
              </div>

              <div className="space-y-3">
                <GameRow
                  sport="Football"
                  emoji="⚽"
                  location="Sports Complex"
                  time="Wed · 6:00 PM"
                  skill="Intermediate"
                  count="8/10"
                  open
                />
                <GameRow
                  sport="Basketball"
                  emoji="🏀"
                  location="Main Court"
                  time="Thu · 5:30 PM"
                  skill="Beginner"
                  count="6/12"
                  open
                />
                <GameRow
                  sport="Tennis"
                  emoji="🎾"
                  location="Tennis Courts"
                  time="Fri · 4:00 PM"
                  skill="Advanced"
                  count="4/4"
                />
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-[28px] border border-[var(--up-border)] bg-[var(--up-surface)] p-5 sm:p-6">
                <h3 className="font-[family:var(--font-display)] text-base font-bold tracking-tight">
                  Quick actions
                </h3>
                <div className="mt-4 space-y-2.5">
                  {quickActions.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-2.5 rounded-[12px] border border-[var(--up-border)] bg-[var(--up-surface-2)] px-3 py-2.5 text-sm font-medium text-[var(--up-muted)] transition hover:border-[rgba(163,230,53,0.25)] hover:text-[var(--up-text)]"
                    >
                      <span className="text-[var(--up-accent)]">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-[rgba(163,230,53,0.15)] bg-[var(--up-surface)] p-5 sm:p-6">
                <div className="flex items-center gap-2.5">
                  <TrophyIcon />
                  <h3 className="font-[family:var(--font-display)] text-base font-bold tracking-tight">
                    Complete your profile
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--up-muted)]">
                  Add your sports and skill levels so others can find you for
                  the right games.
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--up-border-mid)]">
                  <div className="h-full w-[30%] rounded-full bg-[var(--up-accent)]" />
                </div>
                <p className="mt-2 text-xs text-[var(--up-muted)]">
                  Profile 30% complete
                </p>
                <Link
                  href="/profile"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] border border-[rgba(163,230,53,0.25)] bg-[var(--up-accent-bg)] px-4 text-sm font-bold text-[var(--up-accent)] transition hover:bg-[rgba(163,230,53,0.14)]"
                >
                  Set up profile
                </Link>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`mb-1 flex items-center gap-2.5 rounded-[10px] border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-[rgba(163,230,53,0.16)] bg-[var(--up-accent-bg)] text-[var(--up-accent)]"
          : "border-transparent text-[var(--up-muted)] hover:border-[var(--up-border-mid)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-text)]"
      }`}
    >
      <span
        className={
          active ? "text-[var(--up-accent)]" : "text-[var(--up-muted)]"
        }
      >
        {icon}
      </span>
      {label}
    </Link>
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

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect width="28" height="28" rx="8" fill="#a3e635" />
        <path d="M7 14 L14 7 L21 14 L14 21 Z" fill="#0b0f1a" />
        <circle cx="14" cy="14" r="3" fill="#a3e635" />
      </svg>
      <span className="font-[family:var(--font-display)] text-lg font-bold tracking-tight">
        UniPlay
      </span>
    </div>
  );
}

function HomeIcon() {
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
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GamepadIcon() {
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
      <rect x="2" y="6" width="20" height="12" rx="4" />
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="17.5" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function UserIcon() {
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
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

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
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

function TrophyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="8 21 12 17 16 21" />
      <line x1="12" y1="17" x2="12" y2="11" />
      <path d="M17 4H7l1 8a4 4 0 0 0 8 0l1-8z" />
      <path d="M17 4c1.5 0 3.5 1 3.5 5s-2 5-3.5 5" />
      <path d="M7 4C5.5 4 3.5 5 3.5 9s2 5 3.5 5" />
    </svg>
  );
}

function RefreshIcon() {
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
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15A9 9 0 1 1 23 10" />
    </svg>
  );
}
