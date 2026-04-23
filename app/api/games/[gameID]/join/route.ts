import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/lib/auth";
import { joinGame } from "@/src/services/participation.service";

export async function POST(
  _req: Request,
  context: { params: Promise<{ gameID: string }> },
): Promise<NextResponse> {
  const { gameID } = await context.params;

  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await joinGame({ userID, gameID });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to join game";

    if (message === "Game not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (
      message === "Game is not open for joining" ||
      message === "Game is full"
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    throw err;
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
