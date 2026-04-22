import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/src/lib/auth";
import {
  listSportProfiles,
  removeSportProfile,
  upsertSportProfile,
} from "@/src/services/profile.service";

const UpsertProfileSchema = z.object({
  sport: z.string().min(2, "Sport must be at least 2 characters").max(50),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});

const DeleteProfileSchema = z.object({
  sport: z.string().min(2, "Sport must be at least 2 characters").max(50),
});

async function getAuthedUserID(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET(): Promise<NextResponse> {
  const userID = await getAuthedUserID();
  if (!userID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await listSportProfiles(userID);
  return NextResponse.json({ profiles }, { status: 200 });
}

export async function POST(req: Request): Promise<NextResponse> {
  const userID = await getAuthedUserID();
  if (!userID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpsertProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 422 },
    );
  }

  const profile = await upsertSportProfile({ userID, ...parsed.data });
  return NextResponse.json({ profile }, { status: 200 });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const userID = await getAuthedUserID();
  if (!userID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = DeleteProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 422 },
    );
  }

  await removeSportProfile({ userID, sport: parsed.data.sport });
  return NextResponse.json({ ok: true }, { status: 200 });
}
