"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function GameForm({
  gameID,
  initialData,
  isEditing = false,
}: GameFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sport, setSport] = useState(initialData?.sport ?? "");
  const [dateTime, setDateTime] = useState(
    initialData?.dateTime ?? new Date().toISOString().slice(0, 16),
  );
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [skillLevel, setSkillLevel] = useState<string>(
    initialData?.skillLevel ?? "BEGINNER",
  );
  const [maxParticipants, setMaxParticipants] = useState<string>(
    String(initialData?.maxParticipants ?? 4),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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

      const data = await response.json();
      router.push(`/games/${data.game.gameID}`);
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
      className="space-y-6 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
    >
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="sport" className="block text-sm font-medium">
          Sport
        </label>
        <select
          id="sport"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Select a sport</option>
          <option value="Cricket">Cricket</option>
          <option value="Football">Football</option>
          <option value="Basketball">Basketball</option>
          <option value="Tennis">Tennis</option>
          <option value="Volleyball">Volleyball</option>
          <option value="Table Tennis">Table Tennis</option>
        </select>
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
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="skillLevel" className="block text-sm font-medium">
          Skill Level
        </label>
        <select
          id="skillLevel"
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
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
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Saving..." : isEditing ? "Update Game" : "Create Game"}
      </button>
    </form>
  );
}
