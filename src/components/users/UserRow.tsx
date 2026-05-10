"use client";

export type UserRowData = {
  userID: string;
  name: string;
  sportCount?: number;
  sport?: string;
  skillLevel?: string;
};

export function UserRow({
  user,
  onViewProfile,
  onInvite,
  showSkillLevel = false,
}: {
  user: UserRowData;
  onViewProfile: (userID: string) => void;
  onInvite?: (userID: string) => void;
  showSkillLevel?: boolean;
}) {
  const skillLabel =
    user.skillLevel === "BEGINNER"
      ? "Beginner"
      : user.skillLevel === "INTERMEDIATE"
        ? "Intermediate"
        : "Advanced";

  return (
    <li className="flex items-center justify-between rounded-[12px] border border-[var(--up-border)] bg-[var(--up-surface-2)] px-4 py-3">
      <div>
        <p className="text-sm font-medium">{user.name}</p>
        {showSkillLevel && user.sport && user.skillLevel ? (
          <p className="text-xs text-[var(--up-muted)]">
            {user.sport} • {skillLabel}
          </p>
        ) : user.sportCount !== undefined ? (
          <p className="text-xs text-[var(--up-muted)]">
            {user.sportCount} sport{user.sportCount !== 1 ? "s" : ""}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onViewProfile(user.userID)}
          className="rounded-[10px] border border-[var(--up-border-mid)] px-3 py-1 text-sm font-medium text-[var(--up-text)] transition hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
        >
          View Profile
        </button>
        <button
          onClick={() => onInvite?.(user.userID)}
          disabled={!onInvite}
          className={`rounded-[10px] border border-[var(--up-border-mid)] px-3 py-1 text-sm font-medium transition ${
            onInvite
              ? "text-[var(--up-text)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
              : "cursor-not-allowed text-[var(--up-muted)] opacity-50"
          }`}
        >
          Invite
        </button>
      </div>
    </li>
  );
}
