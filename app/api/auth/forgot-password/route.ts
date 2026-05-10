import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { issuePasswordReset } from "@/src/services/auth.service";

const ForgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ForgotSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Validation error";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  try {
    await issuePasswordReset(parsed.data.email);
    // Always return 200 to avoid account enumeration
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Could not send reset email" }, { status: 503 });
  }
}
