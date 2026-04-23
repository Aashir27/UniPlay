import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userID = session.user.id;

  const [gamesJoined, gamesHosted, sportsActive, notifications, openGames] =
    await Promise.all([
      // Games the user joined as a participant (not counting games they created)
      prisma.participation.count({
        where: {
          userID,
          status: { in: ["PENDING", "ACCEPTED"] },
          game: { creatorID: { not: userID } },
        },
      }),
      // Active games the user created
      prisma.game.count({
        where: {
          creatorID: userID,
          status: { notIn: ["CANCELLED", "COMPLETED"] },
        },
      }),
      // Sport profiles added by the user
      prisma.sportProfile.count({ where: { userID } }),
      // Unread notifications
      prisma.notification.count({
        where: { recipientID: userID, isRead: false },
      }),
      // Latest open games for the feed (up to 5)
      prisma.game.findMany({
        where: { status: "OPEN" },
        orderBy: { dateTime: "asc" },
        take: 5,
      }),
    ]);

  return (
    <DashboardClient
      userName={session.user.name ?? "UniPlay member"}
      userRole={session.user.role}
      userID={userID}
      stats={{ gamesJoined, gamesHosted, sportsActive, notifications }}
      openGames={openGames.map((g) => ({
        gameID: g.gameID,
        sport: g.sport,
        location: g.location,
        dateTime: g.dateTime.toISOString(),
        skillLevel: g.skillLevel,
        currentCount: g.currentCount,
        maxParticipants: g.maxParticipants,
        status: g.status,
      }))}
    />
  );
}
