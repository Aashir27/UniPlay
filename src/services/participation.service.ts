import type { Participation, PrismaClient } from "@prisma/client";
import {
  GameStatus,
  NotificationType,
  ParticipationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

export interface JoinGameInput {
  userID: string;
  gameID: string;
}

export interface CancelParticipationInput {
  userID: string;
  gameID: string;
}

function isRetryableTransactionError(error: unknown): boolean {
  // Prisma: "Transaction failed due to a write conflict or a deadlock. Please retry your transaction"
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function joinGame(
  input: JoinGameInput,
  db: PrismaClient = prisma,
): Promise<Participation> {
  // Process 4.0 (Join Game)
  // CRITICAL CONCURRENCY HANDLING: use Prisma interactive transaction.

  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const game = await tx.game.findUnique({
            where: { gameID: input.gameID },
          });

          if (!game) {
            throw new Error("Game not found");
          }

          if (game.status !== GameStatus.OPEN) {
            throw new Error("Game is not open for joining");
          }

          if (game.currentCount >= game.maxParticipants) {
            throw new Error("Game is full");
          }

          const existing = await tx.participation.findUnique({
            where: {
              userID_gameID: {
                userID: input.userID,
                gameID: input.gameID,
              },
            },
          });

          if (existing) {
            return existing;
          }

          const participation = await tx.participation.create({
            data: {
              userID: input.userID,
              gameID: input.gameID,
              status: ParticipationStatus.PENDING,
            },
          });

          const nextCount = game.currentCount + 1;
          const nextStatus =
            nextCount >= game.maxParticipants ? GameStatus.FULL : game.status;

          await tx.game.update({
            where: { gameID: game.gameID },
            data: {
              currentCount: { increment: 1 },
              status: nextStatus,
            },
          });

          await tx.notification.create({
            data: {
              recipientID: game.creatorID,
              type: NotificationType.JOIN_REQUEST,
              message: "A student requested to join your game.",
              relatedGameID: game.gameID,
            },
          });

          return participation;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      if (!isLastAttempt && isRetryableTransactionError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Join game failed after retries");
}

export async function cancelParticipation(
  input: CancelParticipationInput,
  db: PrismaClient = prisma,
): Promise<void> {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await db.$transaction(
        async (tx) => {
          const participation = await tx.participation.findUnique({
            where: {
              userID_gameID: { userID: input.userID, gameID: input.gameID },
            },
          });

          if (
            !participation ||
            participation.status === ParticipationStatus.CANCELLED
          ) {
            throw new Error("Participation not found");
          }

          await tx.participation.update({
            where: {
              userID_gameID: { userID: input.userID, gameID: input.gameID },
            },
            data: { status: ParticipationStatus.CANCELLED },
          });

          const game = await tx.game.update({
            where: { gameID: input.gameID },
            data: { currentCount: { decrement: 1 } },
          });

          if (game.status === GameStatus.FULL) {
            await tx.game.update({
              where: { gameID: input.gameID },
              data: { status: GameStatus.OPEN },
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      if (!isLastAttempt && isRetryableTransactionError(error)) {
        continue;
      }
      throw error;
    }
  }
}
