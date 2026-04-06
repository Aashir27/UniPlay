import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";

import { register } from "@/src/services/auth.service";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
  role: z.nativeEnum(Role).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Validation error";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  try {
    const user = await register(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes("already exists")) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }

      if (err.message.includes("Could not send verification email")) {
        return NextResponse.json(
          { error: err.message },
          { status: 503 },
        );
      }
    }

    console.error("[register]", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
