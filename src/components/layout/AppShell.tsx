"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";

type AppShellProps = {
  children: React.ReactNode;
  userName?: string | null;
};

type NotificationItem = {
  notifID: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <HomeIcon /> },
  { href: "/games", label: "Browse games", icon: <GamepadIcon /> },
  { href: "/profile", label: "My profile", icon: <UserIcon /> },
  { href: "/games/new", label: "Post a game", icon: <PlusIcon /> },
  { href: "/games/manage", label: "My games", icon: <ListIcon /> },
];

export function AppShell({ children, userName }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = (userName ?? "UP")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelTop, setPanelTop] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // silently ignore network errors
    }
  }, []);

  // Fetch count on mount and every 60 s
  useEffect(() => {
    if (!userName) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [userName, fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        bellRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) return;
      setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [notifOpen]);

  function handleBellClick() {
    if (!notifOpen) {
      const rect = bellRef.current?.getBoundingClientRect();
      setPanelTop(rect?.top ?? 120);
      setNotifLoading(true);
      fetchNotifications().finally(() => setNotifLoading(false));
    }
    setNotifOpen((v) => !v);
  }

  async function handleClear() {
    setClearing(true);
    try {
      await fetch("/api/notifications", { method: "DELETE" });
      setNotifications([]);
    } finally {
      setClearing(false);
    }
  }

  if (!userName) {
    return (
      <div className="min-h-screen bg-[var(--up-bg)] text-[var(--up-text)]">
        {children}
      </div>
    );
  }

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  const count = notifications.length;

  return (
    <div className="min-h-screen bg-[var(--up-bg)] text-[var(--up-text)] flex">
      <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-[var(--up-border)] bg-[var(--up-surface)] px-4 py-6">
        <Link href={userName ? "/dashboard" : "/"} className="mb-7 flex items-center gap-2.5 px-2">
          <LogoMark />
        </Link>

        <p className="mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--up-muted)]">
          Menu
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActivePath(pathname, item.href)}
            />
          ))}

          {/* Notification bell nav item */}
          <div ref={bellRef}>
            <button
              type="button"
              onClick={handleBellClick}
              className={`flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2 text-sm font-medium transition ${
                notifOpen
                  ? "border-[rgba(163,230,53,0.16)] bg-[var(--up-accent-bg)] text-[var(--up-accent)]"
                  : "border-transparent text-[var(--up-muted)] hover:border-[var(--up-border-mid)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-text)]"
              }`}
            >
              <span className={`relative shrink-0 ${notifOpen ? "text-[var(--up-accent)]" : "text-[var(--up-muted)]"}`}>
                <BellIcon />
                {count > 0 && (
                  <span className="absolute -top-[6px] -right-[6px] flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[var(--up-accent)] px-[3px] text-[0.5rem] font-bold leading-none text-[#0b0f1a]">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </span>
              Notifications
            </button>
          </div>
        </nav>

        <div className="mt-auto border-t border-[var(--up-border)] px-2 pt-4">
          {userName ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(163,230,53,0.25)] bg-[var(--up-accent-bg)] text-[0.7rem] font-bold text-[var(--up-accent)]">
                  {initials}
                </div>
                <p className="min-w-0 truncate text-[0.82rem] font-semibold">
                  {userName}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-[9px] border border-[var(--up-border-mid)] px-3 text-[0.78rem] font-medium text-[var(--up-muted)] transition hover:border-[rgba(163,230,53,0.25)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                className="flex h-9 items-center justify-center rounded-[9px] bg-[var(--up-accent)] px-3 text-[0.78rem] font-bold text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex h-9 items-center justify-center rounded-[9px] border border-[var(--up-border-mid)] px-3 text-[0.78rem] font-medium text-[var(--up-muted)] transition hover:border-[rgba(163,230,53,0.25)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Notification panel — fixed, appears to the right of sidebar */}
      {notifOpen && (
        <div
          ref={panelRef}
          className="fixed z-50 w-[320px] overflow-hidden rounded-[16px] border border-[var(--up-border)] bg-[var(--up-surface)] shadow-2xl shadow-black/40"
          style={{ left: "228px", top: `${panelTop}px` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--up-border)] px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing || count === 0}
              className="text-[0.72rem] font-medium text-[var(--up-muted)] transition hover:text-[var(--up-danger)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {clearing ? "Clearing…" : "Clear all"}
            </button>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifLoading && count === 0 ? (
              <p className="py-10 text-center text-xs text-[var(--up-muted)]">Loading…</p>
            ) : count === 0 ? (
              <p className="py-10 text-center text-xs text-[var(--up-muted)]">No notifications</p>
            ) : (
              notifications.map((n) => (
                <NotifRow key={n.notifID} notification={n} />
              ))
            )}
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function NotifRow({ notification }: { notification: NotificationItem }) {
  const icon = notifIcon(notification.type);
  const time = new Date(notification.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex gap-3 border-b border-[var(--up-border)] px-4 py-3 last:border-0">
      <span className="mt-0.5 shrink-0 text-base">{icon}</span>
      <div className="min-w-0">
        <p className="text-[0.8rem] leading-snug text-[var(--up-text)]">
          {notification.message}
        </p>
        <p className="mt-1 text-[0.68rem] text-[var(--up-muted)]">{time}</p>
      </div>
    </div>
  );
}

function notifIcon(type: string): string {
  switch (type) {
    case "JOIN_REQUEST": return "🙋";
    case "JOIN_CONFIRM": return "✏️";
    case "WITHDRAWAL": return "🚪";
    case "CANCELLATION": return "❌";
    case "REMINDER": return "⏰";
    default: return "🔔";
  }
}

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/games") return /^\/games\/[0-9a-fA-F-]{36}$/.test(pathname);
  return pathname.startsWith(`${href}/`);
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
      className={`flex items-center gap-2.5 rounded-[10px] border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-[rgba(163,230,53,0.16)] bg-[var(--up-accent-bg)] text-[var(--up-accent)]"
          : "border-transparent text-[var(--up-muted)] hover:border-[var(--up-border-mid)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-text)]"
      }`}
    >
      <span className={active ? "text-[var(--up-accent)]" : "text-[var(--up-muted)]"}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function LogoMark() {
  return (
    <>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect width="28" height="28" rx="8" fill="#a3e635" />
        <path d="M7 14 L14 7 L21 14 L14 21 Z" fill="#0b0f1a" />
        <circle cx="14" cy="14" r="3" fill="#a3e635" />
      </svg>
      <span className="font-[family:var(--font-display)] text-lg font-bold tracking-tight">
        UniPlay
      </span>
    </>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GamepadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
