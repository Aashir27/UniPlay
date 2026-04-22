import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import GameForm from "@/src/components/games/GameForm";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ gameID: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { gameID } = await params;

  const game = await prisma.game.findUnique({ where: { gameID } });

  if (!game) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-10">
        <h1 className="text-3xl font-bold">Game not found</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Create a game first, then open this URL with a real game ID.
        </p>
      </main>
    );
  }

  if (game.creatorID !== session.user.id) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-10">
        <h1 className="text-3xl font-bold">Forbidden</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          FR-38: Only the game creator can edit or delete this game.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold">Edit Game</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Update the game details below.
        </p>
      </div>

      <GameForm
        gameID={gameID}
        initialData={{
          sport: game.sport,
          dateTime: game.dateTime.toISOString().slice(0, 16),
          location: game.location,
          skillLevel: game.skillLevel,
          maxParticipants: game.maxParticipants,
        }}
        isEditing={true}
      />
    </main>
  );
}
