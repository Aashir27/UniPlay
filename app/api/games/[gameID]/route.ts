import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { NotificationType } from "@prisma/client";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { updateGame } from "@/src/services/game.service";

const UpdateGameSchema = z.object({
  sport: z.string().min(2).max(50).optional(),
  dateTime: z.coerce.date().optional(),
  location: z.string().min(2).max(120).optional(),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  maxParticipants: z.number().int().min(2).max(200).optional(),
  status: z.enum(["DRAFT", "OPEN", "FULL", "CANCELLED", "COMPLETED"]).optional(),
});

async function assertCreator(gameID: string): Promise<
  | { ok: true; userID: string }
  | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const game = await prisma.game.findUnique({
    where: { gameID },
    select: { creatorID: true },
  });

  if (!game) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Game not found" }, { status: 404 }),
    };
  }

  if (game.creatorID !== userID) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userID };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ gameID: string }> },
): Promise<NextResponse> {
  const { gameID } = await context.params;

  const auth = await assertCreator(gameID);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateGameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 422 },
    );
  }

  // Fetch game before update so we can diff what changed
  const before = await prisma.game.findUnique({
    where: { gameID },
    select: {
      sport: true,
      location: true,
      dateTime: true,
      skillLevel: true,
      maxParticipants: true,
    },
  });

  const game = await updateGame({ gameID, ...parsed.data });

  // Build a human-readable summary of changes
  if (before) {
    const changes: string[] = [];
    if (parsed.data.sport && parsed.data.sport !== before.sport)
      changes.push(`sport changed to ${parsed.data.sport}`);
    if (parsed.data.location && parsed.data.location !== before.location)
      changes.push(`location changed to "${parsed.data.location}"`);
    if (parsed.data.dateTime) {
      const newDate = new Date(parsed.data.dateTime);
      if (newDate.getTime() !== before.dateTime.getTime())
        changes.push(
          `date/time changed to ${newDate.toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}`,
        );
    }
    if (parsed.data.skillLevel && parsed.data.skillLevel !== before.skillLevel)
      changes.push(`skill level changed to ${parsed.data.skillLevel.toLowerCase()}`);
    if (
      parsed.data.maxParticipants !== undefined &&
      parsed.data.maxParticipants !== before.maxParticipants
    )
      changes.push(`max participants changed to ${parsed.data.maxParticipants}`);

    if (changes.length > 0) {
      // Notify all active participants (excluding the creator)
      const participants = await prisma.participation.findMany({
        where: {
          gameID,
          status: { in: ["PENDING", "ACCEPTED"] },
          userID: { not: auth.userID },
        },
        select: { userID: true },
      });

      if (participants.length > 0) {
        const summary = changes.join("; ");
        await prisma.notification.createMany({
          data: participants.map((p) => ({
            recipientID: p.userID,
            type: NotificationType.JOIN_CONFIRM,
            message: `The ${game.sport} game at ${game.location} was updated by the organiser: ${summary}.`,
            relatedGameID: gameID,
          })),
        });
      }

      // If the date changed, delete existing reminders for all participants
      // so checkAndCreateReminders can re-evaluate them against the new date
      if (parsed.data.dateTime) {
        const newDate = new Date(parsed.data.dateTime);
        if (newDate.getTime() !== before.dateTime.getTime()) {
          await prisma.notification.deleteMany({
            where: {
              relatedGameID: gameID,
              type: NotificationType.REMINDER,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ game }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ gameID: string }> },
): Promise<NextResponse> {
  const { gameID } = await context.params;

  const auth = await assertCreator(gameID);
  if (!auth.ok) return auth.response;

  // Fetch game and participants before deletion so we can notify them
  const game = await prisma.game.findUnique({
    where: { gameID },
    select: {
      sport: true,
      location: true,
      dateTime: true,
      participations: {
        where: {
          status: { in: ["PENDING", "ACCEPTED"] },
          userID: { not: auth.userID },
        },
        select: { userID: true },
      },
    },
  });

  if (game && game.participations.length > 0) {
    const dateLabel = game.dateTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    await prisma.notification.createMany({
      data: game.participations.map((p) => ({
        recipientID: p.userID,
        type: NotificationType.CANCELLATION,
        message: `The ${game.sport} game at ${game.location} on ${dateLabel} has been cancelled by the organiser.`,
        relatedGameID: gameID,
      })),
    });
  }

  await prisma.game.delete({ where: { gameID } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
