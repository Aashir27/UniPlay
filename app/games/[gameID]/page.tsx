import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { ParticipationStatus } from "@prisma/client";

import { authOptions } from "@/src/lib/auth";
import ViewGameClient from "./ViewGameClient";

export const dynamic = "force-dynamic";

export default async function ViewGamePage({
  params,
}: {
  params: Promise<{ gameID: string }>;
}) {
  const { gameID } = await params;

  const game = await prisma.game.findUnique({
    where: { gameID },
    include: {
      creator: { select: { userID: true, name: true, email: true } },
      participations: {
        where: {
          status: ParticipationStatus.ACCEPTED,
        },
        include: {
          user: { select: { userID: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!game) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-10">
        <h1 className="text-3xl font-bold">Game not found</h1>
        <p className="text-sm text-[var(--up-muted)]">
          The game you&apos;re looking for doesn&apos;t exist.
        </p>
      </main>
    );
  }

  const session = await getServerSession(authOptions);
  const currentUserID = session?.user?.id ?? null;
  const isCreator = currentUserID === game.creatorID;
  const hasJoined =
    currentUserID !== null &&
    game.participations.some((p) => p.userID === currentUserID);
  const currentCount = game.participations.length;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <ViewGameClient
        game={{ ...game, currentCount }}
        isCreator={isCreator}
        currentUserID={currentUserID}
        hasJoined={hasJoined}
      />
    </main>
  );
}
