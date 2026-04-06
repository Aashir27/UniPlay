import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { login } from "@/src/services/auth.service";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Validation error";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  try {
    const user = await login(parsed.data);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials or unverified account." },
        { status: 401 },
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 },
    );
  }
}
