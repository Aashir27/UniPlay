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
            if (
              existing.status === ParticipationStatus.PENDING ||
              existing.status === ParticipationStatus.ACCEPTED
            ) {
              return existing;
            }

            const rejoined = await tx.participation.update({
              where: {
                userID_gameID: {
                  userID: input.userID,
                  gameID: input.gameID,
                },
              },
              data: {
                status: ParticipationStatus.PENDING,
                joinedAt: new Date(),
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

            const rejoiner = await tx.user.findUnique({
              where: { userID: input.userID },
              select: { name: true },
            });
            const rejoinerName = rejoiner?.name ?? "A player";

            await tx.notification.create({
              data: {
                recipientID: game.creatorID,
                type: NotificationType.JOIN_REQUEST,
                message: `${rejoinerName} joined your ${game.sport} game at ${game.location}.`,
                relatedGameID: game.gameID,
              },
            });

            return rejoined;
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

          const joiner = await tx.user.findUnique({
            where: { userID: input.userID },
            select: { name: true },
          });
          const joinerName = joiner?.name ?? "A player";

          await tx.notification.create({
            data: {
              recipientID: game.creatorID,
              type: NotificationType.JOIN_REQUEST,
              message: `${joinerName} joined your ${game.sport} game at ${game.location}.`,
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
            (participation.status !== ParticipationStatus.PENDING &&
              participation.status !== ParticipationStatus.ACCEPTED)
          ) {
            throw new Error("Participation not found");
          }

          await tx.participation.update({
            where: {
              userID_gameID: { userID: input.userID, gameID: input.gameID },
            },
            data: { status: ParticipationStatus.CANCELLED },
          });

          const game = await tx.game.findUnique({
            where: { gameID: input.gameID },
            select: {
              currentCount: true,
              maxParticipants: true,
              status: true,
            },
          });

          if (!game) {
            throw new Error("Game not found");
          }

          const nextCount = Math.max(game.currentCount - 1, 0);
          const nextStatus =
            game.status === GameStatus.FULL &&
            nextCount < game.maxParticipants
              ? GameStatus.OPEN
              : game.status;

          await tx.game.update({
            where: { gameID: input.gameID },
            data: {
              currentCount: nextCount,
              status: nextStatus,
            },
          });

          // Notify creator that a participant withdrew (skip if withdrawer is the creator)
          const fullGame = await tx.game.findUnique({
            where: { gameID: input.gameID },
            select: { creatorID: true, sport: true, location: true },
          });
          if (fullGame && fullGame.creatorID !== input.userID) {
            const withdrawer = await tx.user.findUnique({
              where: { userID: input.userID },
              select: { name: true },
            });
            const withdrawerName = withdrawer?.name ?? "A player";
            await tx.notification.create({
              data: {
                recipientID: fullGame.creatorID,
                type: NotificationType.WITHDRAWAL,
                message: `${withdrawerName} left your ${fullGame.sport} game at ${fullGame.location}.`,
                relatedGameID: input.gameID,
              },
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
