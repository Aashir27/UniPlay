import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { resendOtp } from "@/src/services/auth.service";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const attempts = new Map<string, number[]>();

function isRateLimited(userID: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const ts = (attempts.get(userID) ?? []).filter((t) => t > windowStart);

  if (ts.length >= MAX_ATTEMPTS) return true;

  attempts.set(userID, [...ts, now]);
  return false;
}

const ResendOtpSchema = z.object({
  userID: z.string().uuid("Invalid userID"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ResendOtpSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Validation error";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const { userID } = parsed.data;

  if (isRateLimited(userID)) {
    return NextResponse.json(
      { error: "Too many resend attempts. Please wait before trying again." },
      { status: 429 },
    );
  }

  try {
    await resendOtp(userID);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (
        err.message === "User not found" ||
        err.message === "User is already verified"
      ) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }

    console.error("[resend-otp]", err);
    return NextResponse.json(
      { error: "Could not resend code. Please try again." },
      { status: 500 },
    );
  }
}
