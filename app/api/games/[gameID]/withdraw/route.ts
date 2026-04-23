import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { cancelParticipation } from "@/src/services/participation.service";

export async function POST(
  _req: Request,
  context: { params: Promise<{ gameID: string }> },
): Promise<NextResponse> {
  const { gameID } = await context.params;

  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const game = await prisma.game.findUnique({
    where: { gameID },
    select: { creatorID: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.creatorID === userID) {
    return NextResponse.json(
      { error: "The game creator cannot withdraw" },
      { status: 400 },
    );
  }

  try {
    await cancelParticipation({ userID, gameID });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to withdraw from game";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
