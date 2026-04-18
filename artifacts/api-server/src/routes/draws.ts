import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, drawsTable, scoresTable, subscriptionsTable } from "@workspace/db";
import {
  ListDrawsResponse,
  ListDrawsQueryParams,
  GetCurrentDrawResponse,
  GetDrawParams,
  GetDrawResponse,
  CreateDrawBody,
  SimulateDrawParams,
  SimulateDrawBody,
  SimulateDrawResponse,
  PublishDrawParams,
  PublishDrawResponse,
} from "@workspace/api-zod";

const router = Router();

function serializeDraw(d: typeof drawsTable.$inferSelect) {
  return {
    ...d,
    jackpotAmount: Number(d.jackpotAmount),
    totalPool: Number(d.totalPool),
    publishedAt: d.publishedAt?.toISOString() ?? null,
  };
}

function generateWinningNumbers(): string {
  const nums: number[] = [];
  while (nums.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums.sort((a, b) => a - b).join(",");
}

function generateAlgorithmicNumbers(allScores: number[]): string {
  if (allScores.length === 0) return generateWinningNumbers();

  const freq: Record<number, number> = {};
  for (const s of allScores) {
    freq[s] = (freq[s] || 0) + 1;
  }

  const weighted: number[] = [];
  for (const [score, count] of Object.entries(freq)) {
    for (let i = 0; i < count; i++) {
      weighted.push(Number(score));
    }
  }

  const selected: number[] = [];
  const pool = [...weighted];
  while (selected.length < 5 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const val = pool[idx];
    if (!selected.includes(val) && val >= 1 && val <= 45) {
      selected.push(val);
    }
    pool.splice(idx, 1);
    if (pool.length === 0 && selected.length < 5) {
      return generateWinningNumbers();
    }
  }

  if (selected.length < 5) return generateWinningNumbers();
  return selected.sort((a, b) => a - b).join(",");
}

router.get("/draws", async (req, res): Promise<void> => {
  const qp = ListDrawsQueryParams.safeParse(req.query);

  let draws = await db
    .select()
    .from(drawsTable)
    .orderBy(desc(drawsTable.year), desc(drawsTable.createdAt));

  if (qp.success && qp.data.status) {
    draws = draws.filter((d) => d.status === qp.data.status);
  }

  const publishedDraws = draws.filter(
    (d) => d.status === "published" || d.status === "completed" || d.status === "active" || d.status === "upcoming",
  );

  res.json(ListDrawsResponse.parse(publishedDraws.map(serializeDraw)));
});

router.get("/draws/current", async (req, res): Promise<void> => {
  const [draw] = await db
    .select()
    .from(drawsTable)
    .where(eq(drawsTable.status, "active"))
    .orderBy(desc(drawsTable.createdAt))
    .limit(1);

  if (!draw) {
    res.status(404).json({ error: "No active draw" });
    return;
  }

  res.json(GetCurrentDrawResponse.parse(serializeDraw(draw)));
});

router.post("/draws", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateDrawBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const activeSubs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.status, "active"));

  const totalPool = activeSubs.length * 9.99;
  const jackpotAmount = totalPool * 0.4;

  const [draw] = await db
    .insert(drawsTable)
    .values({
      month: parsed.data.month,
      year: parsed.data.year,
      drawType: parsed.data.drawType,
      status: "upcoming",
      totalPool: totalPool.toFixed(2),
      jackpotAmount: jackpotAmount.toFixed(2),
      participantCount: activeSubs.length,
    })
    .returning();

  res.status(201).json(serializeDraw(draw));
});

router.get("/draws/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetDrawParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [draw] = await db
    .select()
    .from(drawsTable)
    .where(eq(drawsTable.id, params.data.id));

  if (!draw) {
    res.status(404).json({ error: "Draw not found" });
    return;
  }

  res.json(GetDrawResponse.parse(serializeDraw(draw)));
});

router.post("/draws/:id/simulate", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SimulateDrawParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SimulateDrawBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [draw] = await db
    .select()
    .from(drawsTable)
    .where(eq(drawsTable.id, params.data.id));

  if (!draw) {
    res.status(404).json({ error: "Draw not found" });
    return;
  }

  let winningNumbers: string;

  if (body.data.drawType === "algorithmic") {
    const allScores = await db.select().from(scoresTable);
    const scoreValues = allScores.map((s) => s.score);
    winningNumbers = generateAlgorithmicNumbers(scoreValues);
  } else {
    winningNumbers = generateWinningNumbers();
  }

  const winningSet = new Set(
    winningNumbers.split(",").map((n) => parseInt(n, 10)),
  );

  const allUsers = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .innerJoin(
      subscriptionsTable,
      and(
        eq(usersTable.id, subscriptionsTable.userId),
        eq(subscriptionsTable.status, "active"),
      ),
    );

  let matches5 = 0;
  let matches4 = 0;
  let matches3 = 0;

  for (const u of allUsers) {
    const userScores = await db
      .select()
      .from(scoresTable)
      .where(eq(scoresTable.userId, u.id))
      .limit(5);
    const userNums = new Set(userScores.map((s) => s.score));
    const matchCount = [...userNums].filter((n) => winningSet.has(n)).length;
    if (matchCount >= 5) matches5++;
    else if (matchCount >= 4) matches4++;
    else if (matchCount >= 3) matches3++;
  }

  const totalPool = Number(draw.totalPool);
  const prize5 = matches5 > 0 ? (totalPool * 0.4) / matches5 : totalPool * 0.4;
  const prize4 = matches4 > 0 ? (totalPool * 0.35) / matches4 : 0;
  const prize3 = matches3 > 0 ? (totalPool * 0.25) / matches3 : 0;

  await db
    .update(drawsTable)
    .set({
      winningNumbers,
      status: "simulated",
      drawType: body.data.drawType,
    })
    .where(eq(drawsTable.id, params.data.id));

  res.json(
    SimulateDrawResponse.parse({
      drawId: draw.id,
      winningNumbers,
      matches5,
      matches4,
      matches3,
      prize5,
      prize4,
      prize3,
    }),
  );
});

router.post("/draws/:id/publish", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = PublishDrawParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [draw] = await db
    .select()
    .from(drawsTable)
    .where(eq(drawsTable.id, params.data.id));

  if (!draw) {
    res.status(404).json({ error: "Draw not found" });
    return;
  }

  const [updated] = await db
    .update(drawsTable)
    .set({
      status: "published",
      publishedAt: new Date(),
    })
    .where(eq(drawsTable.id, params.data.id))
    .returning();

  res.json(PublishDrawResponse.parse(serializeDraw(updated)));
});

export default router;
