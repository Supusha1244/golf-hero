import { Router } from "express";
import { eq, sum } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable, winnersTable, drawsTable } from "@workspace/db";
import {
  GetPrizePoolResponse,
  GetMyWinningsResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/prizes/pool", async (req, res): Promise<void> => {
  const activeSubs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.status, "active"));

  const totalPool = activeSubs.length * 9.99;
  const jackpotPool = totalPool * 0.4;
  const pool4Match = totalPool * 0.35;
  const pool3Match = totalPool * 0.25;

  const [latestDraw] = await db
    .select()
    .from(drawsTable)
    .where(eq(drawsTable.status, "published"))
    .limit(1);

  const jackpotRolledOver = latestDraw?.jackpotRolledOver ?? false;

  res.json(
    GetPrizePoolResponse.parse({
      totalPool,
      jackpotPool,
      pool4Match,
      pool3Match,
      jackpotRolledOver,
      activeSubscribers: activeSubs.length,
    }),
  );
});

router.get("/prizes/my-winnings", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (!dbUser) {
    res.json([]);
    return;
  }

  const myWinners = await db
    .select({
      winner: winnersTable,
      draw: drawsTable,
    })
    .from(winnersTable)
    .innerJoin(drawsTable, eq(winnersTable.drawId, drawsTable.id))
    .where(eq(winnersTable.userId, dbUser.id));

  const result = myWinners.map((row) => ({
    id: row.winner.id,
    drawId: row.winner.drawId,
    drawMonth: row.draw.month,
    drawYear: row.draw.year,
    matchType: row.winner.matchType,
    prizeAmount: Number(row.winner.prizeAmount),
    paymentStatus: row.winner.paymentStatus,
    createdAt: row.winner.createdAt.toISOString(),
  }));

  res.json(GetMyWinningsResponse.parse(result));
});

export default router;
