"use client";

import { useEffect, useState, useMemo } from "react";
import { Select } from "@/src/components/ui/Select";
import { UserRow } from "@/src/components/users/UserRow";

type SportProfile = {
  sport: string;
  skillLevel: string;
};

type User = {
  userID: string;
  name: string;
  email: string;
  sportProfiles: SportProfile[];
};

type UsersApiResponse = {
  users?: User[];
  error?: string;
};

const SPORTS = [
  "Cricket",
  "Football",
  "Basketball",
  "Tennis",
  "Volleyball",
  "Table Tennis",
  "Foosball",
  "Swimming",
];

export function InvitePlayersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [selectedUserID, setSelectedUserID] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      const res = await fetch("/api/users", { method: "GET" });
      const data = (await res.json()) as UsersApiResponse;

      if (!res.ok) {
        setError(data.error ?? "Failed to load users.");
        setIsLoading(false);
        return;
      }

      setUsers(data.users ?? []);
      setIsLoading(false);
    }

    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (
        sportFilter &&
        !user.sportProfiles.some((p) => p.sport === sportFilter)
      ) {
        return false;
      }

      if (
        skillFilter &&
        !user.sportProfiles.some((p) => p.skillLevel === skillFilter)
      ) {
        return false;
      }

      return true;
    });
  }, [users, search, sportFilter, skillFilter]);

  const selectedUser = users.find((u) => u.userID === selectedUserID);

  if (isLoading) {
    return (
      <section className="rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-5">
        <p className="text-sm text-[var(--up-muted)]">Loading...</p>
      </section>
    );
  }

  if (selectedUser) {
    return (
      <ViewProfileView
        user={selectedUser}
        onBack={() => setSelectedUserID(null)}
      />
    );
  }

  return (
    <AllUsersView
      users={filteredUsers}
      search={search}
      onSearchChange={setSearch}
      sportFilter={sportFilter}
      onSportFilterChange={setSportFilter}
      skillFilter={skillFilter}
      onSkillFilterChange={setSkillFilter}
      onViewProfile={setSelectedUserID}
      error={error}
    />
  );
}

function AllUsersView({
  users,
  search,
  onSearchChange,
  sportFilter,
  onSportFilterChange,
  skillFilter,
  onSkillFilterChange,
  onViewProfile,
  error,
}: {
  users: User[];
  search: string;
  onSearchChange: (value: string) => void;
  sportFilter: string;
  onSportFilterChange: (value: string) => void;
  skillFilter: string;
  onSkillFilterChange: (value: string) => void;
  onViewProfile: (userID: string) => void;
  error: string | null;
}) {
  return (
    <section className="space-y-5 rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-5">
      {error && (
        <div className="rounded-lg border border-[rgba(248,113,113,0.18)] bg-[var(--up-danger-bg)] p-4 text-sm text-[var(--up-danger)]">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by username..."
          className="w-full rounded-[10px] border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] px-3 py-2 text-[var(--up-text)] placeholder:text-[var(--up-muted)]"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            value={sportFilter}
            onChange={onSportFilterChange}
            options={[
              { value: "", label: "All Sports" },
              ...SPORTS.map((s) => ({ value: s, label: s })),
            ]}
            placeholder="Filter by Sport"
            buttonClassName="w-full"
          />

          <Select
            value={skillFilter}
            onChange={onSkillFilterChange}
            options={[
              { value: "", label: "All Skill Levels" },
              {
                value: "BEGINNER",
                label: "Beginner",
              },
              {
                value: "INTERMEDIATE",
                label: "Intermediate",
              },
              {
                value: "ADVANCED",
                label: "Advanced",
              },
            ]}
            placeholder="Filter by Skill Level"
            buttonClassName="w-full"
          />
        </div>
      </div>

      {users.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--up-muted)]">
          No users found.
        </p>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => (
            <UserRow
              key={user.userID}
              user={{
                userID: user.userID,
                name: user.name,
                sportCount: user.sportProfiles.length,
              }}
              onViewProfile={onViewProfile}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ViewProfileView({ user, onBack }: { user: User; onBack: () => void }) {
  return (
    <section className="space-y-5 rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-5">
      <div>
        <h2 className="font-[family:var(--font-display)] text-2xl font-bold">
          {user.name}
        </h2>
        <p className="mt-1 text-sm text-[var(--up-muted)]">{user.email}</p>
      </div>

      <div>
        <h3 className="font-semibold">Sports Profile</h3>
        {user.sportProfiles.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--up-muted)]">
            No sports added yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {user.sportProfiles.map((profile, idx) => {
              const skillLabel =
                profile.skillLevel === "BEGINNER"
                  ? "Beginner"
                  : profile.skillLevel === "INTERMEDIATE"
                    ? "Intermediate"
                    : "Advanced";
              return (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-[12px] border border-[var(--up-border)] bg-[var(--up-surface-2)] px-3 py-2"
                >
                  <span className="text-sm font-medium">{profile.sport}</span>
                  <span className="text-xs text-[var(--up-muted)]">
                    {skillLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        onClick={onBack}
        className="rounded-[10px] border border-[var(--up-border-mid)] px-4 py-2 font-medium text-[var(--up-text)] transition hover:border-[rgba(163,230,53,0.25)] hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)]"
      >
        Back
      </button>
    </section>
  );
}
