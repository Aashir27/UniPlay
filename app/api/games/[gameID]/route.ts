import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { updateGame } from "@/src/services/game.service";

const UpdateGameSchema = z.object({
  sport: z.string().min(2).max(50).optional(),
  dateTime: z.coerce.date().optional(),
  location: z.string().min(2).max(120).optional(),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  maxParticipants: z.number().int().min(2).max(200).optional(),
  status: z.enum(["DRAFT", "OPEN", "FULL", "CANCELLED", "COMPLETED"]).optional(),
});

async function assertCreator(gameID: string): Promise<
  | { ok: true; userID: string }
  | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  const userID = session?.user?.id;

  if (!userID) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const game = await prisma.game.findUnique({
    where: { gameID },
    select: { creatorID: true },
  });

  if (!game) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Game not found" }, { status: 404 }),
    };
  }

  if (game.creatorID !== userID) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userID };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ gameID: string }> },
): Promise<NextResponse> {
  const { gameID } = await context.params;

  const auth = await assertCreator(gameID);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateGameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 422 },
    );
  }

  const game = await updateGame({ gameID, ...parsed.data });
  return NextResponse.json({ game }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ gameID: string }> },
): Promise<NextResponse> {
  const { gameID } = await context.params;

  const auth = await assertCreator(gameID);
  if (!auth.ok) return auth.response;

  await prisma.game.delete({ where: { gameID } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
