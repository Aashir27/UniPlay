import type {
  Game,
  GameStatus,
  Prisma,
  PrismaClient,
  SkillLevel,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface CreateGameInput {
  creatorID: string;
  sport: string;
  dateTime: Date;
  location: string;
  skillLevel: SkillLevel;
  maxParticipants: number;
}

export interface FilterGamesInput {
  sport?: string;
  status?: GameStatus;
  creatorID?: string;
  skillLevel?: SkillLevel;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface UpdateGameInput {
  gameID: string;
  sport?: string;
  dateTime?: Date;
  location?: string;
  skillLevel?: SkillLevel;
  maxParticipants?: number;
  status?: GameStatus;
}

export async function createGame(
  input: CreateGameInput,
  db: DbClient = prisma,
): Promise<Game> {
  // Process 3.0 (Create Games)
  return db.game.create({
    data: {
      creatorID: input.creatorID,
      sport: input.sport,
      dateTime: input.dateTime,
      location: input.location,
      skillLevel: input.skillLevel,
      maxParticipants: input.maxParticipants,
      // status defaults to DRAFT
    },
  });
}

export async function filterGames(
  input: FilterGamesInput,
  db: DbClient = prisma,
): Promise<Game[]> {
  // Process 3.0 (Filter Games)
  const where: Prisma.GameWhereInput = {
    sport: input.sport,
    status: input.status,
    creatorID: input.creatorID,
    skillLevel: input.skillLevel,
    ...(input.dateFrom || input.dateTo
      ? {
          dateTime: {
            ...(input.dateFrom ? { gte: input.dateFrom } : {}),
            ...(input.dateTo ? { lte: input.dateTo } : {}),
          },
        }
      : {}),
  };

  return db.game.findMany({
    where,
    orderBy: { dateTime: "asc" },
  });
}

export async function updateGame(
  input: UpdateGameInput,
  db: DbClient = prisma,
): Promise<Game> {
  // Process 3.0 (Update Games)
  return db.game.update({
    where: { gameID: input.gameID },
    data: {
      sport: input.sport,
      dateTime: input.dateTime,
      location: input.location,
      skillLevel: input.skillLevel,
      maxParticipants: input.maxParticipants,
      status: input.status,
    },
  });
}
