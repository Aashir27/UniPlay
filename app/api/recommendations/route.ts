import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const currentUserID = session?.user?.id;

  if (!currentUserID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch sports from games created by the current user
  const createdGames = await prisma.game.findMany({
    where: { creatorID: currentUserID },
    select: { sport: true },
    distinct: ["sport"],
  });

  const sports = createdGames.map((g) => g.sport);

  if (sports.length === 0) {
    return NextResponse.json({ recommendations: [] }, { status: 200 });
  }

  // Find users with matching sports in their profile
  const skillLevelOrder = { ADVANCED: 0, INTERMEDIATE: 1, BEGINNER: 2 };

  const users = await prisma.user.findMany({
    where: {
      userID: { not: currentUserID },
      sportProfiles: {
        some: {
          sport: { in: sports },
        },
      },
    },
    select: {
      userID: true,
      name: true,
      email: true,
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
        email: user.email,
        sport: profile.sport,
        skillLevel: profile.skillLevel,
      })),
    )
    .sort(
      (a, b) =>
        (skillLevelOrder[a.skillLevel as keyof typeof skillLevelOrder] ?? 3) -
        (skillLevelOrder[b.skillLevel as keyof typeof skillLevelOrder] ?? 3),
    );

  return NextResponse.json({ recommendations }, { status: 200 });
}
