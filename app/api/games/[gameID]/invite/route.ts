import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { formatSportEvent } from "@/src/lib/formatSport";
import { NotificationType, ParticipationStatus } from "@prisma/client";

const SendInviteSchema = z.object({
  targetUserID: z.string().uuid("Invalid user ID"),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ gameID: string }> },
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const senderID = session?.user?.id;

  if (!senderID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameID } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SendInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 422 },
    );
  }

  const { targetUserID } = parsed.data;

  // Verify game exists and sender is participant
  const game = await prisma.game.findUnique({
    where: { gameID },
    include: {
      participations: {
        where: { userID: senderID },
      },
      creator: {
        select: { name: true },
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.participations.length === 0) {
    return NextResponse.json(
      { error: "You must join the game to invite others" },
      { status: 403 },
    );
  }

  // Verify target user exists
  const targetUser = await prisma.user.findUnique({
    where: { userID: targetUserID },
    select: { name: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if target user already has active participation
  const existing = await prisma.participation.findUnique({
    where: {
      userID_gameID: {
        userID: targetUserID,
        gameID,
      },
    },
  });

  const hasActiveParticipation =
    existing?.status === ParticipationStatus.PENDING ||
    existing?.status === ParticipationStatus.ACCEPTED;

  if (hasActiveParticipation) {
    return NextResponse.json(
      { error: "User is already invited or a participant" },
      { status: 400 },
    );
  }

  const shouldReactivateParticipation =
    existing?.status === ParticipationStatus.CANCELLED ||
    existing?.status === ParticipationStatus.REJECTED;

  // Check if invite notification already exists for this user+game
  const existingInvite = await prisma.notification.findFirst({
    where: {
      recipientID: targetUserID,
      relatedGameID: gameID,
      type: NotificationType.GAME_INVITE,
    },
  });

  if (existingInvite && !shouldReactivateParticipation) {
    return NextResponse.json(
      { error: "Invite already sent to this user for this game" },
      { status: 400 },
    );
  }
  const gameDetails = formatSportEvent(game.sport);

  const message = `${game.creator.name} invited you to join a ${gameDetails}`;

  try {
    const notification = await prisma.$transaction(async (tx) => {
      if (shouldReactivateParticipation) {
        await tx.participation.update({
          where: {
            userID_gameID: {
              userID: targetUserID,
              gameID,
            },
          },
          data: {
            status: ParticipationStatus.PENDING,
            joinedAt: new Date(),
          },
        });
      } else {
        await tx.participation.create({
          data: {
            userID: targetUserID,
            gameID,
            status: ParticipationStatus.PENDING,
          },
        });
      }

      return tx.notification.create({
        data: {
          recipientID: targetUserID,
          type: NotificationType.GAME_INVITE,
          message,
          relatedGameID: gameID,
        },
      });
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Failed to create notification:", errorMsg);
    return NextResponse.json(
      { error: `Failed to send invite: ${errorMsg}` },
      { status: 500 },
    );
  }
}
