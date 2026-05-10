import type { Notification, PrismaClient } from "@prisma/client";
import { NotificationType, Prisma } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

export interface CreateNotificationInput {
  recipientID: string;
  type: NotificationType;
  message: string;
  relatedGameID?: string;
}

export interface ListNotificationsInput {
  recipientID: string;
  onlyUnread?: boolean;
}

export async function createNotification(
  input: CreateNotificationInput,
  db: PrismaClient = prisma,
): Promise<Notification> {
  // Process 5.0 (Triggering alerts)
  return db.notification.create({
    data: {
      recipientID: input.recipientID,
      type: input.type,
      message: input.message,
      relatedGameID: input.relatedGameID,
    },
  });
}

export async function listNotifications(
  input: ListNotificationsInput,
  db: PrismaClient = prisma,
): Promise<Notification[]> {
  // Process 5.0 (Triggering alerts)
  // Always return only unread so the count stays consistent with the dashboard stat
  const where: Prisma.NotificationWhereInput = {
    recipientID: input.recipientID,
    isRead: false,
  };

  return db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function markAsRead(
  notifID: string,
  db: PrismaClient = prisma,
): Promise<Notification> {
  return db.notification.update({
    where: { notifID },
    data: { isRead: true },
  });
}

export async function clearNotifications(
  recipientID: string,
  db: PrismaClient = prisma,
): Promise<void> {
  // Mark as read instead of deleting so reminder deduplication still works —
  // reminders that were "cleared" won't be recreated on the next check.
  await db.notification.updateMany({
    where: { recipientID, isRead: false },
    data: { isRead: true },
  });
}

export async function checkAndCreateReminders(
  userID: string,
  db: PrismaClient = prisma,
): Promise<void> {
  const now = new Date();

  // 3-day window: game is between 60h and 84h from now
  const window3Low = new Date(now.getTime() + 60 * 60 * 60 * 1000);
  const window3High = new Date(now.getTime() + 84 * 60 * 60 * 1000);

  // 1-day window: game is between 12h and 36h from now
  const window1Low = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const window1High = new Date(now.getTime() + 36 * 60 * 60 * 1000);

  const participations = await db.participation.findMany({
    where: {
      userID,
      status: { in: ["PENDING", "ACCEPTED"] },
      game: {
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
    },
    include: { game: true },
  });

  for (const p of participations) {
    const game = p.game;
    const gameTime = game.dateTime;

    const dateLabel = gameTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    // 3-day reminder — only meaningful if the user joined before the 3-day window
    // opened (i.e. they joined when the game was still more than 60h away).
    // If they joined when the game was already within 3 days they already know
    // about it, so the reminder would just be noise.
    const joinedBeforeThreeDayWindow =
      p.joinedAt < new Date(game.dateTime.getTime() - 60 * 60 * 60 * 1000);

    if (gameTime >= window3Low && gameTime < window3High && joinedBeforeThreeDayWindow) {
      const already = await db.notification.findFirst({
        where: {
          recipientID: userID,
          relatedGameID: game.gameID,
          type: NotificationType.REMINDER,
          message: { contains: "3 days" },
        },
      });
      if (!already) {
        await db.notification.create({
          data: {
            recipientID: userID,
            type: NotificationType.REMINDER,
            message: `Reminder: Your ${game.sport} game at ${game.location} is in 3 days (${dateLabel}).`,
            relatedGameID: game.gameID,
          },
        });
      }
    }

    // 1-day reminder
    if (gameTime >= window1Low && gameTime < window1High) {
      const already = await db.notification.findFirst({
        where: {
          recipientID: userID,
          relatedGameID: game.gameID,
          type: NotificationType.REMINDER,
          message: { contains: "tomorrow" },
        },
      });
      if (!already) {
        await db.notification.create({
          data: {
            recipientID: userID,
            type: NotificationType.REMINDER,
            message: `Reminder: Your ${game.sport} game at ${game.location} is tomorrow (${dateLabel}).`,
            relatedGameID: game.gameID,
          },
        });
      }
    }
  }
}
