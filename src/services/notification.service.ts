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
  const where: Prisma.NotificationWhereInput = {
    recipientID: input.recipientID,
    ...(input.onlyUnread ? { isRead: false } : {}),
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
