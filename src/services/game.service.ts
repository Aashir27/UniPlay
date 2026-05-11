import type {
  Game,
  GameStatus,
  Prisma,
  PrismaClient,
  SkillLevel,
} from "@prisma/client";
import { ParticipationStatus } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;

type CountedGame = { gameID: string; currentCount: number };

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
  status?: GameStatus | GameStatus[];
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
      status: "OPEN",
    },
  });
}

export async function filterGames(
  input: FilterGamesInput,
  db: DbClient = prisma,
): Promise<Game[]> {
  // Process 3.0 (Filter Games)
  const statusFilter = Array.isArray(input.status)
    ? { in: input.status }
    : input.status;

  const where: Prisma.GameWhereInput = {
    sport: input.sport,
    status: statusFilter,
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

  const games = await db.game.findMany({
    where,
    orderBy: { dateTime: "asc" },
  });

  return withAcceptedParticipantCounts(games, db);
}

export async function withAcceptedParticipantCounts<T extends CountedGame>(
  games: T[],
  db: DbClient = prisma,
): Promise<T[]> {
  if (games.length === 0) return games;

  const counts = await db.participation.groupBy({
    by: ["gameID"],
    where: {
      gameID: { in: games.map((game) => game.gameID) },
      status: ParticipationStatus.ACCEPTED,
    },
    _count: { _all: true },
  });
  const countByGameID = new Map(
    counts.map((count) => [count.gameID, count._count._all]),
  );

  return games.map((game) => ({
    ...game,
    currentCount: countByGameID.get(game.gameID) ?? 0,
  }));
}

export async function getAcceptedParticipantCount(
  gameID: string,
  db: DbClient = prisma,
): Promise<number> {
  return db.participation.count({
    where: {
      gameID,
      status: ParticipationStatus.ACCEPTED,
    },
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
