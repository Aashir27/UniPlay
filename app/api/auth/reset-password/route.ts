import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { resetPassword } from "@/src/services/auth.service";

const ResetSchema = z.object({
  userID: z.string().uuid(),
  token: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ResetSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Validation error";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  try {
    const ok = await resetPassword({
      userID: parsed.data.userID,
      token: parsed.data.token,
      newPassword: parsed.data.newPassword,
    });

    if (!ok) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
