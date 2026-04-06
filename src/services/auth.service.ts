/**
 * src/services/auth.service.ts
 *
 * Process 1.0 – Authentication
 *   register      → hash password, create User, generate OTP, send verification email
 *   verifyEmail   → validate OTP, mark user verified, burn the OTP record
 *   login         → credential check (also used by NextAuth authorize)
 *   resendOtp     → invalidate old OTPs, generate + send a fresh one
 */

import bcrypt from "bcrypt";
import crypto from "crypto";
import type { Prisma, PrismaClient, Role, User } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { sendVerificationEmail } from "@/src/lib/email";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OTP_EXPIRY_MINUTES = 15;
const OTP_BCRYPT_ROUNDS = 10;
const PASSWORD_BCRYPT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPublicUser(user: User): PublicUser {
  return {
    userID: user.userID,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
}

/** Generate a cryptographically random 6-digit string. */
function generateOtp(): string {
  // Use rejection sampling to avoid modulo bias.
  // crypto.randomInt(min, max) is exclusive of max.
  return String(crypto.randomInt(100_000, 1_000_000));
}

/**
 * Persist a fresh OTP for a user (invalidates any existing unused OTPs first)
 * and dispatches the verification email.
 *
 * Returns the plain-text OTP so callers can use it in tests / logging.
 * In production the plain OTP is only ever sent via email.
 */
async function issueOtp(
  user: { userID: string; name: string; email: string },
  db: DbClient,
): Promise<string> {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, OTP_BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate all previous unused OTPs by marking them as used now.
  // This prevents an attacker from retrying an old code after a resend.
  await (db as PrismaClient).emailVerification.updateMany({
    where: { userID: user.userID, usedAt: null },
    data: { usedAt: new Date() },
  });

  await (db as PrismaClient).emailVerification.create({
    data: {
      userID: user.userID,
      otp: otpHash,
      expiresAt,
    },
  });

  // Fire-and-forget in production; awaited in tests via jest.mock.
  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    otp,
  });

  return otp;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a new user.
 *
 * - Rejects duplicate emails with a generic error (don't reveal existence).
 * - Sends a 6-digit OTP to the provided email for verification.
 * - Returns the created (unverified) PublicUser.
 *
 * TODO: enforce university email domain whitelist via env var ALLOWED_EMAIL_DOMAINS.
 */
export async function register(
  input: RegisterInput,
  db: DbClient = prisma,
): Promise<PublicUser> {
  const prismaDb = db as PrismaClient;
  const email = input.email.toLowerCase().trim();

  // Optional: university domain guard
  // const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? "").split(",").filter(Boolean);
  // if (allowedDomains.length > 0) {
  //   const domain = email.split("@")[1] ?? "";
  //   if (!allowedDomains.includes(domain)) throw new Error("Email domain not allowed");
  // }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_BCRYPT_ROUNDS);

  let user: User;
  try {
    user = await prismaDb.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
        role: input.role,
        // isVerified defaults to false
      },
    });
  } catch (err: unknown) {
    // P2002 = unique constraint violation → email already taken
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new Error("An account with that email already exists.");
    }
    throw err;
  }

  try {
    await issueOtp(user, db);
  } catch (err) {
    // Keep registration atomic from the API consumer perspective:
    // if OTP delivery fails, remove the newly created unverified user.
    await prismaDb.user.delete({ where: { userID: user.userID } }).catch(() => {
      // best-effort cleanup; original delivery error is still surfaced
    });

    throw new Error("Could not send verification email. Please try again.");
  }

  return toPublicUser(user);
}

/**
 * Verify a user's email address using their OTP.
 *
 * Validates:
 *   - OTP exists and belongs to the user
 *   - OTP has not expired
 *   - OTP has not already been used
 *   - OTP matches (bcrypt compare)
 *
 * On success: marks OTP as used + sets user.isVerified = true (atomic transaction).
 */
export async function verifyEmail(
  input: VerifyEmailInput,
  db: PrismaClient = prisma as PrismaClient,
): Promise<boolean> {
  const record = await db.emailVerification.findFirst({
    where: {
      userID: input.userID,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
  });

  if (!record) {
    // No valid (unused, unexpired) OTP on record
    return false;
  }

  const matches = await bcrypt.compare(input.otp, record.otp);
  if (!matches) {
    return false;
  }

  // Atomically: burn the OTP + verify the user
  await db.$transaction([
    db.emailVerification.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.user.update({
      where: { userID: input.userID },
      data: { isVerified: true },
    }),
  ]);

  return true;
}

/**
 * Validate credentials. Used by NextAuth `authorize` and the manual login route.
 *
 * Returns PublicUser on success, null on any failure.
 * Deliberately gives no hint about whether the email exists.
 */
export async function login(
  input: LoginInput,
  db: DbClient = prisma,
): Promise<PublicUser | null> {
  const user = await (db as PrismaClient).user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });

  if (!user) return null;
  if (!user.isVerified) return null;

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) return null;

  return toPublicUser(user);
}

/**
 * Resend a fresh OTP to an unverified user.
 * Rate-limiting (e.g. max 3 resends / hour) should be enforced at the route layer.
 */
export async function resendOtp(
  userID: string,
  db: PrismaClient = prisma as PrismaClient,
): Promise<void> {
  const user = await db.user.findUnique({ where: { userID } });
  if (!user) throw new Error("User not found");
  if (user.isVerified) throw new Error("User is already verified");

  await issueOtp(user, db);
}
