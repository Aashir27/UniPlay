import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ userID: string }> },
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userID } = await context.params;

  const user = await prisma.user.findUnique({
    where: { userID },
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
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user }, { status: 200 });
}
