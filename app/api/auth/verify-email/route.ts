import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyEmail } from "@/src/services/auth.service";

const VerifyEmailSchema = z.object({
  userID: z.string().uuid("Invalid userID"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = VerifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Validation error";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  try {
    const ok = await verifyEmail(parsed.data);

    if (!ok) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[verify-email]", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}
