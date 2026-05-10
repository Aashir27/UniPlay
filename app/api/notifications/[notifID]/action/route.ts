import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ParticipationStatus, Prisma } from "@prisma/client";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { markAsRead } from "@/src/services/notification.service";
import { joinGame } from "@/src/services/participation.service";

const NotificationActionSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ notifID: string }> },
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notifID } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = NotificationActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 422 },
    );
  }

  const { action } = parsed.data;

  // Fetch notification
  const notification = await prisma.notification.findUnique({
    where: { notifID },
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  if (notification.recipientID !== userID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "decline") {
    // Mark as read
    await markAsRead(notifID);
    return NextResponse.json({ ok: true });
  }

  if (action === "accept") {
    if (!notification.relatedGameID) {
      return NextResponse.json(
        { error: "No game associated with this notification" },
        { status: 400 },
      );
    }

    try {
      // Join the game
      await joinGame({
        userID,
        gameID: notification.relatedGameID,
      });

      // Mark notification as read
      await markAsRead(notifID);

      return NextResponse.json({ ok: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to join game";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json(
    { error: "Invalid action" },
    { status: 400 },
  );
}
