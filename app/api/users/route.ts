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

  const users = await prisma.user.findMany({
    where: {
      userID: { not: currentUserID },
    },
    select: {
      userID: true,
      name: true,
      email: true,
      sportProfiles: {
        select: {
          sport: true,
          skillLevel: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users }, { status: 200 });
}
