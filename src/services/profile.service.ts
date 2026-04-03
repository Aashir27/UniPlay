import type {
  Prisma,
  PrismaClient,
  SkillLevel,
  SportProfile,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface UpsertSportProfileInput {
  userID: string;
  sport: string;
  skillLevel: SkillLevel;
}

export interface RemoveSportProfileInput {
  userID: string;
  sport: string;
}

export async function upsertSportProfile(
  input: UpsertSportProfileInput,
  db: DbClient = prisma,
): Promise<SportProfile> {
  // Process 2.0 (Update Skill Levels / Manage Interests)
  return db.sportProfile.upsert({
    where: {
      userID_sport: {
        userID: input.userID,
        sport: input.sport,
      },
    },
    create: {
      userID: input.userID,
      sport: input.sport,
      skillLevel: input.skillLevel,
    },
    update: {
      skillLevel: input.skillLevel,
    },
  });
}

export async function removeSportProfile(
  input: RemoveSportProfileInput,
  db: DbClient = prisma,
): Promise<void> {
  // Process 2.0 (Manage Interests)
  await db.sportProfile.delete({
    where: {
      userID_sport: {
        userID: input.userID,
        sport: input.sport,
      },
    },
  });
}

export async function listSportProfiles(
  userID: string,
  db: DbClient = prisma,
): Promise<SportProfile[]> {
  // Process 2.0 (Manage Interests)
  return db.sportProfile.findMany({
    where: { userID },
    orderBy: { sport: "asc" },
  });
}
