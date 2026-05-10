import type { Participation, PrismaClient } from "@prisma/client";
import {
  GameStatus,
  NotificationType,
  ParticipationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { formatSportEvent, getSportEventNoun } from "@/src/lib/formatSport";

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
            const eventLabel = formatSportEvent(game.sport);

            await tx.notification.create({
              data: {
                recipientID: game.creatorID,
                type: NotificationType.JOIN_REQUEST,
                message: `${rejoinerName} joined your ${eventLabel} at ${game.location}.`,
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
          const eventLabel = formatSportEvent(game.sport);

          await tx.notification.create({
            data: {
              recipientID: game.creatorID,
              type: NotificationType.JOIN_REQUEST,
              message: `${joinerName} joined your ${eventLabel} at ${game.location}.`,
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
): Promise<{ gameDeleted: boolean }> {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await db.$transaction(
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

          const game = await tx.game.findUnique({
            where: { gameID: input.gameID },
            select: {
              gameID: true,
              creatorID: true,
              sport: true,
              location: true,
              currentCount: true,
              maxParticipants: true,
              status: true,
              participations: {
                where: {
                  status: { in: [ParticipationStatus.PENDING, ParticipationStatus.ACCEPTED] },
                  userID: { not: input.userID },
                },
                orderBy: { joinedAt: "asc" },
                select: { userID: true, joinedAt: true },
              },
            },
          });

          if (!game) {
            throw new Error("Game not found");
          }

          const otherPlayersCount = game.participations.length;
          const isCreator = game.creatorID === input.userID;

          // Case 1: Creator leaves and other players exist -> transfer host to first player
          if (isCreator && otherPlayersCount > 0) {
            const newCreator = game.participations[0];
            
            await tx.participation.update({
              where: {
                userID_gameID: { userID: input.userID, gameID: input.gameID },
              },
              data: { status: ParticipationStatus.CANCELLED },
            });

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
                creatorID: newCreator.userID,
              },
            });

            const withdrawer = await tx.user.findUnique({
              where: { userID: input.userID },
              select: { name: true },
            });
            const withdrawerName = withdrawer?.name ?? "A player";
            const eventLabel = formatSportEvent(game.sport);
            const eventNoun = getSportEventNoun(game.sport);

            // Notify new host
            await tx.notification.create({
              data: {
                recipientID: newCreator.userID,
                type: NotificationType.JOIN_CONFIRM,
                message: `You are now the host of the ${eventLabel} at ${game.location}. ${withdrawerName} left the ${eventNoun}.`,
                relatedGameID: input.gameID,
              },
            });

            return { gameDeleted: false };
          }

          // Case 2 & 3: Creator leaves with no other players, or last remaining player leaves -> delete game
          if ((isCreator && otherPlayersCount === 0) || otherPlayersCount === 0) {
            // Delete the game
            await tx.game.delete({
              where: { gameID: input.gameID },
            });

            return { gameDeleted: true };
          }

          // Case 4: Regular participant leaves -> just mark as cancelled
          await tx.participation.update({
            where: {
              userID_gameID: { userID: input.userID, gameID: input.gameID },
            },
            data: { status: ParticipationStatus.CANCELLED },
          });

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

          // Notify creator that a participant withdrew
          const withdrawer = await tx.user.findUnique({
            where: { userID: input.userID },
            select: { name: true },
          });
          const withdrawerName = withdrawer?.name ?? "A player";
          const eventLabel = formatSportEvent(game.sport);
          await tx.notification.create({
            data: {
              recipientID: game.creatorID,
              type: NotificationType.WITHDRAWAL,
              message: `${withdrawerName} left your ${eventLabel} at ${game.location}.`,
              relatedGameID: input.gameID,
            },
          });

          return { gameDeleted: false };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      if (!isLastAttempt && isRetryableTransactionError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Cancel participation failed after retries");
}
