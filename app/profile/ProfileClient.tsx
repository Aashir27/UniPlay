"use client";

import { FormEvent, useEffect, useState } from "react";

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
    void loadProfiles();
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
    <section className="space-y-5 rounded-xl border p-5">
      <h2 className="text-xl font-semibold">Your sports profile</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        FR-07, FR-09, FR-10: create profile preferences and assign skill levels.
      </p>

      <form onSubmit={onSave} className="grid gap-3 sm:grid-cols-3">
        <input
          required
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          placeholder="Sport (e.g., Football)"
          className="rounded-md border px-3 py-2 bg-transparent"
        />

        <select
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
          className="rounded-md border px-3 py-2 bg-transparent"
        >
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>

        <button
          disabled={busy}
          className="rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-70"
        >
          {busy ? "Saving..." : "Save"}
        </button>
      </form>

      {message ? <p className="text-emerald-600">{message}</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      <ul className="space-y-2">
        {profiles.map((p) => (
          <li
            key={p.profileID}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span>
              {p.sport} • {p.skillLevel}
            </span>
            <button
              disabled={busy}
              onClick={() => onDelete(p.sport)}
              className="rounded-md border px-3 py-1 text-sm"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
