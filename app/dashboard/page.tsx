import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ParticipationStatus } from "@prisma/client";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { withAcceptedParticipantCounts } from "@/src/services/game.service";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

async function getRecommendations(userID: string) {
  // Fetch sports from games created by the current user
  const createdGames = await prisma.game.findMany({
    where: { creatorID: userID },
    select: { sport: true },
    distinct: ["sport"],
  });

  const sports = createdGames.map((g) => g.sport);

  if (sports.length === 0) {
    return [];
  }

  // Find users with matching sports in their profile
  const skillLevelOrder = { ADVANCED: 0, INTERMEDIATE: 1, BEGINNER: 2 };

  const users = await prisma.user.findMany({
    where: {
      userID: { not: userID },
      sportProfiles: {
        some: {
          sport: { in: sports },
        },
      },
    },
    select: {
      userID: true,
      name: true,
      sportProfiles: {
        where: {
          sport: { in: sports },
        },
        select: {
          sport: true,
          skillLevel: true,
        },
      },
    },
  });

  // Flatten and sort by skill level
  const recommendations = users
    .flatMap((user) =>
      user.sportProfiles.map((profile) => ({
        userID: user.userID,
        name: user.name,
        sport: profile.sport,
        skillLevel: profile.skillLevel,
      })),
    )
    .sort(
      (a, b) =>
        (skillLevelOrder[a.skillLevel as keyof typeof skillLevelOrder] ?? 3) -
        (skillLevelOrder[b.skillLevel as keyof typeof skillLevelOrder] ?? 3),
    );

  return recommendations;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userID = session.user.id;

  const [
    gamesJoined,
    gamesHosted,
    sportsActive,
    notifications,
    openGames,
    recommendations,
  ] = await Promise.all([
    // Games the user joined as a participant (not counting games they created)
    prisma.participation.count({
      where: {
        userID,
        status: ParticipationStatus.ACCEPTED,
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
    prisma.game
      .findMany({
        where: { status: "OPEN" },
        orderBy: { dateTime: "asc" },
        take: 5,
      })
      .then((games) => withAcceptedParticipantCounts(games)),
    // Get recommendations
    getRecommendations(userID),
  ]);

  return (
    <DashboardClient
      userName={session.user.name ?? "UniPlay member"}
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
      recommendations={recommendations}
    />
  );
}
