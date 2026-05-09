"use client";

import { FormEvent, useEffect, useState } from "react";
import { Select } from "@/src/components/ui/Select";

type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

type SportProfile = {
  profileID: string;
  userID: string;
  sport: string;
  skillLevel: SkillLevel;
};

type ProfileApiResponse = {
  profiles?: SportProfile[];
  profile?: SportProfile;
  error?: string;
};

export function ProfileClient() {
  const [sport, setSport] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("BEGINNER");
  const [profiles, setProfiles] = useState<SportProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadProfiles() {
    const res = await fetch("/api/profile", { method: "GET" });
    const data = (await res.json()) as ProfileApiResponse;

    if (!res.ok) {
      setError(data.error ?? "Failed to load profile.");
      return;
    }

    setProfiles(data.profiles ?? []);
  }

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/profile", { method: "GET" });
      const data = (await res.json()) as ProfileApiResponse;

      if (!res.ok) {
        setError(data.error ?? "Failed to load profile.");
        return;
      }

      setProfiles(data.profiles ?? []);
    }

    void load();
  }, []);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport, skillLevel }),
    });

    const data = (await res.json()) as ProfileApiResponse;

    if (!res.ok) {
      setError(data.error ?? "Could not save sport profile.");
      setBusy(false);
      return;
    }

    setMessage("Saved!");
    setSport("");
    setBusy(false);
    await loadProfiles();
  }

  async function onDelete(sportName: string) {
    setBusy(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport: sportName }),
    });

    const data = (await res.json()) as ProfileApiResponse;

    if (!res.ok) {
      setError(data.error ?? "Could not remove sport profile.");
      setBusy(false);
      return;
    }

    setMessage("Removed.");
    setBusy(false);
    await loadProfiles();
  }

  return (
    <section className="space-y-5 rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-5">
      <h2 className="font-[family:var(--font-display)] text-xl font-semibold">
        Your sports profile
      </h2>
      <p className="text-sm text-[var(--up-muted)]">
        Add profile preferences and assign skill levels.
      </p>

      <form onSubmit={onSave} className="grid gap-3 sm:grid-cols-3">
        <input
          required
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          placeholder="Sport (e.g., Football)"
          className="rounded-[10px] border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] px-3 py-2 text-[var(--up-text)] placeholder:text-[var(--up-muted)]"
        />

        <Select
          value={skillLevel}
          onChange={(value) => setSkillLevel(value as SkillLevel)}
          options={[
            { value: "BEGINNER", label: "Beginner" },
            { value: "INTERMEDIATE", label: "Intermediate" },
            { value: "ADVANCED", label: "Advanced" },
          ]}
          buttonClassName="h-full"
        />

        <button
          disabled={busy}
          className="rounded-[10px] bg-[var(--up-accent)] px-4 py-2 font-medium text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)] disabled:opacity-70"
        >
          {busy ? "Saving..." : "Save"}
        </button>
      </form>

      {message ? <p className="text-[var(--up-success)]">{message}</p> : null}
      {error ? <p className="text-[var(--up-danger)]">{error}</p> : null}

      <ul className="space-y-2">
        {profiles.map((p) => (
          <li
            key={p.profileID}
            className="flex items-center justify-between rounded-[12px] border border-[var(--up-border)] bg-[var(--up-surface-2)] px-3 py-2"
          >
            <span>
              {p.sport} - {p.skillLevel}
            </span>
            <button
              disabled={busy}
              onClick={() => onDelete(p.sport)}
              className="rounded-[9px] border border-[var(--up-border-mid)] px-3 py-1 text-sm text-[var(--up-muted)] transition hover:bg-[var(--up-accent-bg)] hover:text-[var(--up-accent)] disabled:opacity-70"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
