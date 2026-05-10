"use client";

import { useEffect, useState } from "react";
import { Select } from "@/src/components/ui/Select";

type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

type SportProfile = {
  profileID: string;
  userID: string;
  sport: string;
  skillLevel: SkillLevel;
};

type SportRow = {
  id: string;
  sport: string;
  skillLevel: SkillLevel;
  isNew: boolean;
  isSaving: boolean;
};

type ProfileApiResponse = {
  profiles?: SportProfile[];
  profile?: SportProfile;
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
const SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export function ProfileClient() {
  const [rows, setRows] = useState<SportRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/profile", { method: "GET" });
      const data = (await res.json()) as ProfileApiResponse;

      if (!res.ok) {
        setError(data.error ?? "Failed to load profile.");
        setIsLoading(false);
        return;
      }

      const profiles = data.profiles ?? [];
      setRows(
        profiles.map((p) => ({
          id: p.profileID,
          sport: p.sport,
          skillLevel: p.skillLevel,
          isNew: false,
          isSaving: false,
        })),
      );
      setIsLoading(false);
    }

    void load();
  }, []);

  function addRow() {
    const newId = `new-${Date.now()}`;
    setRows((prev) => [
      ...prev,
      {
        id: newId,
        sport: "",
        skillLevel: "BEGINNER",
        isNew: true,
        isSaving: false,
      },
    ]);
    setMessage(null);
    setError(null);
  }

  function updateRow(id: string, sport: string, skillLevel: SkillLevel) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, sport, skillLevel } : r)),
    );
  }

  async function saveRow(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row || !row.sport) {
      setError("Please select a sport");
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isSaving: true } : r)),
    );
    setMessage(null);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport: row.sport, skillLevel: row.skillLevel }),
    });

    const data = (await res.json()) as ProfileApiResponse;

    if (!res.ok) {
      setError(data.error ?? "Could not save sport profile.");
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isSaving: false } : r)),
      );
      return;
    }

    if (row.isNew) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                id: data.profile?.profileID ?? id,
                isNew: false,
                isSaving: false,
              }
            : r,
        ),
      );
    } else {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isSaving: false } : r)),
      );
    }

    setMessage("Saved!");
  }

  async function removeRow(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    if (row.isNew) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isSaving: true } : r)),
    );
    setMessage(null);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport: row.sport }),
    });

    const data = (await res.json()) as ProfileApiResponse;

    if (!res.ok) {
      setError(data.error ?? "Could not remove sport profile.");
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isSaving: false } : r)),
      );
      return;
    }

    setRows((prev) => prev.filter((r) => r.id !== id));
    setMessage("Removed.");
  }

  if (isLoading) {
    return (
      <section className="space-y-5 rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-5">
        <h2 className="font-[family:var(--font-display)] text-xl font-semibold">
          Your sports profile
        </h2>
        <p className="text-sm text-[var(--up-muted)]">Loading...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-5">
      <h2 className="font-[family:var(--font-display)] text-xl font-semibold">
        Your sports profile
      </h2>
      <p className="text-sm text-[var(--up-muted)]">
        Add profile preferences and assign skill levels.
      </p>

      <button
        onClick={addRow}
        className="rounded-[10px] bg-[var(--up-accent)] px-4 py-2 font-medium text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)]"
      >
        Add Sport
      </button>

      {message ? <p className="text-[var(--up-success)]">{message}</p> : null}
      {error ? <p className="text-[var(--up-danger)]">{error}</p> : null}

      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-2 rounded-[12px] border border-[var(--up-border)] bg-[var(--up-surface-2)] p-3 sm:flex-row sm:items-center sm:gap-3"
          >
            <Select
              value={row.sport}
              onChange={(value) => updateRow(row.id, value, row.skillLevel)}
              options={SPORTS.map((s) => ({ value: s, label: s }))}
              placeholder="Select Sport"
              disabled={!row.isNew}
              className="flex-1"
              buttonClassName="w-full sm:w-auto"
            />

            <Select
              value={row.skillLevel}
              onChange={(value) =>
                updateRow(row.id, row.sport, value as SkillLevel)
              }
              options={SKILL_LEVELS.map((sl) => ({
                value: sl,
                label:
                  sl === "BEGINNER"
                    ? "Beginner"
                    : sl === "INTERMEDIATE"
                      ? "Intermediate"
                      : "Advanced",
              }))}
              disabled={!row.isNew}
              className="flex-1"
              buttonClassName="w-full sm:w-auto"
            />

            <div className="flex gap-2">
              {row.isNew && (
                <button
                  onClick={() => saveRow(row.id)}
                  disabled={row.isSaving || !row.sport}
                  className="rounded-[10px] bg-[var(--up-accent)] px-3 py-1 text-sm font-medium text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)] disabled:opacity-50"
                >
                  {row.isSaving ? "Saving..." : "Save"}
                </button>
              )}

              <button
                onClick={() => removeRow(row.id)}
                disabled={row.isSaving}
                className="rounded-[10px] border border-[rgba(248,113,113,0.2)] bg-[var(--up-danger-bg)] px-3 py-1 text-sm font-medium text-[var(--up-danger)] transition hover:bg-[rgba(248,113,113,0.14)] disabled:opacity-50"
              >
                {row.isSaving ? "Removing..." : "Remove"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
