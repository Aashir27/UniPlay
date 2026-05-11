import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { ParticipationStatus } from "@prisma/client";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const games = await prisma.game.findMany({
    where: {
      participations: {
        some: {
          userID,
          status: ParticipationStatus.ACCEPTED,
        },
      },
      // Exclude games that have already completed
      status: { not: "COMPLETED" },
    },
    select: {
      gameID: true,
      sport: true,
      dateTime: true,
      location: true,
      skillLevel: true,
    },
    orderBy: { dateTime: "desc" },
  });

  return NextResponse.json({ games });
}
