import { Router } from "express";
import { eq, count, sum } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  usersTable,
  scoresTable,
  subscriptionsTable,
  winnersTable,
  drawsTable,
  charitiesTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetAdminStatsResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
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
    res.json(
      GetDashboardSummaryResponse.parse({
        subscriptionStatus: "inactive",
        subscriptionPlan: null,
        renewalDate: null,
        totalScoresEntered: 0,
        latestScore: null,
        drawsEntered: 0,
        totalWon: 0,
        pendingPayouts: 0,
        selectedCharity: null,
        contributionPercent: 10,
        totalContributed: 0,
      }),
    );
    return;
  }

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, dbUser.id));

  const scores = await db
    .select()
    .from(scoresTable)
    .where(eq(scoresTable.userId, dbUser.id))
    .orderBy(scoresTable.scoreDate)
    .limit(5);

  const myWinnings = await db
    .select()
    .from(winnersTable)
    .where(eq(winnersTable.userId, dbUser.id));

  const totalWon = myWinnings.reduce((acc, w) => acc + Number(w.prizeAmount), 0);
  const pendingPayouts = myWinnings
    .filter((w) => w.paymentStatus === "pending" && w.verificationStatus === "approved")
    .reduce((acc, w) => acc + Number(w.prizeAmount), 0);

  const publishedDraws = await db
    .select()
    .from(drawsTable)
    .where(eq(drawsTable.status, "published"));

  let selectedCharity = null;
  if (dbUser.charityId) {
    const [charity] = await db
      .select()
      .from(charitiesTable)
      .where(eq(charitiesTable.id, dbUser.charityId));
    selectedCharity = charity?.name ?? null;
  }

  const monthlyAmount = sub?.plan === "yearly" ? 99.99 / 12 : 9.99;
  const monthsActive = sub
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - sub.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30),
        ),
      )
    : 0;
  const totalContributed =
    monthlyAmount * monthsActive * (dbUser.charityContributionPercent / 100);

  res.json(
    GetDashboardSummaryResponse.parse({
      subscriptionStatus: sub?.status ?? "inactive",
      subscriptionPlan: sub?.plan ?? null,
      renewalDate: sub?.renewalDate?.toISOString() ?? null,
      totalScoresEntered: scores.length,
      latestScore: scores.length > 0 ? scores[scores.length - 1].score : null,
      drawsEntered: publishedDraws.length,
      totalWon,
      pendingPayouts,
      selectedCharity,
      contributionPercent: dbUser.charityContributionPercent,
      totalContributed,
    }),
  );
});

router.get("/dashboard/admin-stats", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (!dbUser || dbUser.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const allUsers = await db.select().from(usersTable);
  const activeSubs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.status, "active"));

  const monthlyRevenue = activeSubs.reduce(
    (acc, s) => acc + (s.plan === "yearly" ? 99.99 / 12 : 9.99),
    0,
  );

  const totalPool = activeSubs.length * 9.99;

  const allWinnings = await db.select().from(winnersTable);
  const totalCharityContributions = activeSubs.length * 9.99 * 0.1;

  const pendingVerifications = allWinnings.filter(
    (w) => w.verificationStatus === "pending",
  ).length;

  const allDraws = await db.select().from(drawsTable);

  const [latestDraw] = await db
    .select()
    .from(drawsTable)
    .where(eq(drawsTable.status, "published"))
    .limit(1);

  const currentJackpot = latestDraw ? Number(latestDraw.jackpotAmount) : totalPool * 0.4;

  res.json(
    GetAdminStatsResponse.parse({
      totalUsers: allUsers.length,
      activeSubscribers: activeSubs.length,
      monthlyRevenue,
      totalPrizePool: totalPool,
      totalCharityContributions,
      pendingVerifications,
      totalDrawsRun: allDraws.filter(
        (d) => d.status === "published" || d.status === "completed",
      ).length,
      currentJackpot,
    }),
  );
});

export default router;
