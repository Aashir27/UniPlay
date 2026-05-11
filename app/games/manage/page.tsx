import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ParticipationStatus } from "@prisma/client";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import {
  filterGames,
  withAcceptedParticipantCounts,
} from "@/src/services/game.service";
import ManageGamesClient from "./ManageGamesClient";

export default async function ManageGamesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const createdGames = await filterGames({ creatorID: session.user.id });

  const joinedGames = await withAcceptedParticipantCounts(
    await prisma.game.findMany({
      where: {
        participations: {
          some: {
            userID: session.user.id,
            status: ParticipationStatus.ACCEPTED,
          },
        },
        creatorID: {
          not: session.user.id,
        },
        status: {
          not: "COMPLETED",
        },
      },
      orderBy: { dateTime: "asc" },
    }),
  );

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Games</h1>
          <p className="mt-2 text-sm text-[var(--up-muted)]">
            Manage the games you&apos;ve created and joined.
          </p>
        </div>
      </div>

      {createdGames.length === 0 && joinedGames.length === 0 ? (
        <div className="rounded-[20px] border border-[var(--up-border)] bg-[var(--up-surface)] p-8 text-center">
          <p className="text-[var(--up-muted)]">
            You haven&apos;t created or joined any games yet.
          </p>
          <Link
            href="/games"
            className="mt-4 inline-block rounded-[10px] bg-[var(--up-accent)] px-4 py-2 font-medium text-[#0b0f1a] transition hover:bg-[var(--up-accent-dim)]"
          >
            Browse Games
          </Link>
        </div>
      ) : (
        <ManageGamesClient
          createdGames={createdGames}
          joinedGames={joinedGames}
        />
      )}
    </main>
  );
}
