import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/lib/auth";
import { createGame } from "@/src/services/game.service";
import { prisma } from "@/src/lib/prisma";

const CreateGameSchema = z.object({
  sport: z.string().min(2).max(50),
  dateTime: z.coerce.date(),
  location: z.string().min(2).max(120),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  maxParticipants: z.number().int().min(2).max(200),
});

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateGameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 422 },
    );
  }

  // Create game and auto-join creator
  const game = await prisma.$transaction(async (tx: any) => {
    const newGame = await createGame({
      creatorID: userID,
      ...parsed.data,
    }, tx);

    // Auto-join creator as a participant
    await tx.participation.create({
      data: {
        userID,
        gameID: newGame.gameID,
        status: "ACCEPTED",
      },
    });

    // Update game currentCount to reflect creator
    const updatedGame = await tx.game.update({
      where: { gameID: newGame.gameID },
      data: { currentCount: 1 },
    });

    return updatedGame;
  });

  return NextResponse.json({ game }, { status: 201 });
}
