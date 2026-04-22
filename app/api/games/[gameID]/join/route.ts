import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

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
    select: { currentCount: true, maxParticipants: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.currentCount >= game.maxParticipants) {
    return NextResponse.json(
      { error: "Game is full" },
      { status: 400 },
    );
  }

  // Check if user already joined
  const existingParticipation = await prisma.participation.findUnique({
    where: {
      userID_gameID: { userID, gameID },
    },
  });

  if (existingParticipation) {
    return NextResponse.json(
      { error: "Already joined this game" },
      { status: 400 },
    );
  }

  // Add participation and increment currentCount
  await prisma.$transaction([
    prisma.participation.create({
      data: {
        userID,
        gameID,
        status: "ACCEPTED",
      },
    }),
    prisma.game.update({
      where: { gameID },
      data: { currentCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 200 });
}
