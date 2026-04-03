import bcrypt from "bcrypt";
import type { Prisma, PrismaClient, Role, User } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type PublicUser = Pick<
  User,
  "userID" | "name" | "email" | "role" | "isVerified"
>;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  userID: string;
  otp: string;
}

function toPublicUser(user: User): PublicUser {
  return {
    userID: user.userID,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
}

export async function register(
  input: RegisterInput,
  db: DbClient = prisma,
): Promise<PublicUser> {
  // Process 1.0 (Register)
  // TODO: enforce university email whitelist
  // TODO: create/store OTP verification record + send via email

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
    },
  });

  return toPublicUser(user);
}

export async function login(
  input: LoginInput,
  db: DbClient = prisma,
): Promise<PublicUser | null> {
  // Process 1.0 (Login)
  const user = await db.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) return null;
  if (!user.isVerified) return null;

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) return null;

  return toPublicUser(user);
}

export async function verifyEmail(
  _input: VerifyEmailInput,
  _db: DbClient = prisma,
): Promise<boolean> {
  // Process 1.0 (Verify Email)
  // TODO: requires an EmailVerification store/table (OTP + expiry + used flag)
  throw new Error("Not implemented");
}
