import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-10">
      <h1 className="text-3xl font-bold">Creator-only game editor</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        You are the creator of this game. Use the API route
        <code className="mx-1">/api/games/{gameID}</code>
        with PATCH/DELETE from your future UI form.
      </p>
      <pre className="overflow-x-auto rounded-lg border p-4 text-xs">
        {JSON.stringify(game, null, 2)}
      </pre>
    </main>
  );
}
