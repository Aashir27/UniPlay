import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth";
import GameForm from "@/src/components/games/GameForm";
import BackButton from "./BackButton";

export default async function NewGamePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role !== "ORGANIZER") {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Post a New Game</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Fill in the details below to create a new game and invite players.
          </p>
        </div>
      </div>

      <GameForm />

      <BackButton />
    </main>
  );
}
