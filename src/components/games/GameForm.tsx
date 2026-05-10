"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/src/components/ui/Select";

interface GameFormProps {
  gameID?: string;
  initialData?: {
    sport: string;
    dateTime: string;
    location: string;
    skillLevel: string;
    maxParticipants: number;
  };
  isEditing?: boolean;
}

const toLocalDateTimeInputValue = (value?: string | Date) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function GameForm({
  gameID,
  initialData,
  isEditing = false,
}: GameFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sport, setSport] = useState(initialData?.sport ?? "");
  const [dateTime, setDateTime] = useState(() =>
    toLocalDateTimeInputValue(initialData?.dateTime),
  );
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [skillLevel, setSkillLevel] = useState<string>(
    initialData?.skillLevel ?? "BEGINNER",
  );
  const [maxParticipants, setMaxParticipants] = useState<string>(
    String(initialData?.maxParticipants ?? 4),
  );
  const minDateTime = isEditing ? undefined : toLocalDateTimeInputValue();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!sport.trim()) {
      setError("Please select a sport.");
      setIsLoading(false);
      return;
    }

    if (!isEditing) {
      const selectedDate = new Date(dateTime);
      if (Number.isNaN(selectedDate.getTime())) {
        setError("Please select a valid date and time.");
        setIsLoading(false);
        return;
      }
      if (selectedDate.getTime() < Date.now()) {
        setError("Date and time must be in the future.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload = {
        sport: sport.trim(),
        dateTime: new Date(dateTime),
        location: location.trim(),
        skillLevel,
        maxParticipants: parseInt(maxParticipants.toString(), 10),
      };

      const endpoint = isEditing ? `/api/games/${gameID}` : "/api/games";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      await response.json();
      const nextRoute = isEditing ? "/games/manage" : "/games";
      router.push(nextRoute);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-[var(--up-border)] bg-[var(--up-surface)] p-6"
    >
      {error && (
        <div className="rounded-lg border border-[rgba(248,113,113,0.18)] bg-[var(--up-danger-bg)] p-4 text-sm text-[var(--up-danger)]">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="sport" className="block text-sm font-medium">
          Sport
        </label>
        <Select
          id="sport"
          value={sport}
          onChange={setSport}
          options={[
            { value: "", label: "Select a sport" },
            { value: "Cricket", label: "Cricket" },
            { value: "Football", label: "Football" },
            { value: "Basketball", label: "Basketball" },
            { value: "Tennis", label: "Tennis" },
            { value: "Volleyball", label: "Volleyball" },
            { value: "Table Tennis", label: "Table Tennis" },
            { value: "Foosball", label: "Foosball" },
            { value: "Swimming", label: "Swimming" },
          ]}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="dateTime" className="block text-sm font-medium">
          Date & Time
        </label>
        <input
          id="dateTime"
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          min={minDateTime}
          required
          className="mt-1 w-full rounded-lg border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] px-3 py-2 text-[var(--up-text)]"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium">
          Location
        </label>
        <input
          id="location"
          type="text"
          placeholder="e.g., Central Park, Court 3"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          minLength={2}
          maxLength={120}
          required
          className="mt-1 w-full rounded-lg border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] px-3 py-2 text-[var(--up-text)] placeholder:text-[var(--up-muted)]"
        />
      </div>

      <div>
        <label htmlFor="skillLevel" className="block text-sm font-medium">
          Skill Level
        </label>
        <Select
          id="skillLevel"
          value={skillLevel}
          onChange={setSkillLevel}
          options={[
            { value: "BEGINNER", label: "Beginner" },
            { value: "INTERMEDIATE", label: "Intermediate" },
            { value: "ADVANCED", label: "Advanced" },
          ]}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="maxParticipants" className="block text-sm font-medium">
          Max Participants
        </label>
        <input
          id="maxParticipants"
          type="number"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(e.target.value)}
          min={2}
          max={200}
          required
          className="mt-1 w-full rounded-lg border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] px-3 py-2 text-[var(--up-text)]"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-[var(--up-accent)] px-4 py-2 font-medium text-[#0b0f1a] hover:bg-[var(--up-accent-dim)] disabled:opacity-50"
      >
        {isLoading ? "Saving..." : isEditing ? "Update Game" : "Create Game"}
      </button>
    </form>
  );
}
