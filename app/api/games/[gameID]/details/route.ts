import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getAcceptedParticipantCount } from "@/src/services/game.service";

export async function GET(
  _req: Request,
  context: { params: Promise<{ gameID: string }> },
): Promise<NextResponse> {
  const { gameID } = await context.params;

  const game = await prisma.game.findUnique({
    where: { gameID },
    select: {
      gameID: true,
      sport: true,
      dateTime: true,
      location: true,
      skillLevel: true,
      maxParticipants: true,
      currentCount: true,
      status: true,
      creator: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const currentCount = await getAcceptedParticipantCount(game.gameID);

  return NextResponse.json({ game: { ...game, currentCount } });
}
