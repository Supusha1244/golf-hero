import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, scoresTable } from "@workspace/db";
import {
  GetMyScoresResponse,
  AddScoreBody,
  UpdateScoreParams,
  UpdateScoreBody,
  UpdateScoreResponse,
  DeleteScoreParams,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/auth";

const router = Router();

router.get("/scores", async (req, res): Promise<void> => {
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

  const scores = await db
    .select()
    .from(scoresTable)
    .where(eq(scoresTable.userId, dbUser.id))
    .orderBy(desc(scoresTable.scoreDate))
    .limit(5);

  res.json(GetMyScoresResponse.parse(scores));
});

router.post("/scores", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = AddScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const dbUser = await getOrCreateUser(clerkId, `${clerkId}@user.com`);

  const existingForDate = await db
    .select()
    .from(scoresTable)
    .where(
      and(
        eq(scoresTable.userId, dbUser.id),
        eq(scoresTable.scoreDate, parsed.data.scoreDate as string),
      ),
    );

  if (existingForDate.length > 0) {
    res.status(409).json({ error: "A score for this date already exists" });
    return;
  }

  const existingScores = await db
    .select()
    .from(scoresTable)
    .where(eq(scoresTable.userId, dbUser.id))
    .orderBy(desc(scoresTable.scoreDate));

  if (existingScores.length >= 5) {
    const oldest = existingScores[existingScores.length - 1];
    await db.delete(scoresTable).where(eq(scoresTable.id, oldest.id));
  }

  const [score] = await db
    .insert(scoresTable)
    .values({
      userId: dbUser.id,
      score: parsed.data.score,
      scoreDate: parsed.data.scoreDate as string,
    })
    .returning();

  res.status(201).json(score);
});

router.put("/scores/:id", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateScoreParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateScoreBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(scoresTable)
    .where(
      and(
        eq(scoresTable.id, params.data.id),
        eq(scoresTable.userId, dbUser.id),
      ),
    );

  if (!existing) {
    res.status(404).json({ error: "Score not found" });
    return;
  }

  if (body.data.scoreDate && body.data.scoreDate !== existing.scoreDate) {
    const conflict = await db
      .select()
      .from(scoresTable)
      .where(
        and(
          eq(scoresTable.userId, dbUser.id),
          eq(scoresTable.scoreDate, body.data.scoreDate as string),
        ),
      );
    if (conflict.length > 0) {
      res.status(409).json({ error: "A score for this date already exists" });
      return;
    }
  }

  const [updated] = await db
    .update(scoresTable)
    .set({
      score: body.data.score ?? existing.score,
      scoreDate: (body.data.scoreDate as string) ?? existing.scoreDate,
    })
    .where(eq(scoresTable.id, params.data.id))
    .returning();

  res.json(UpdateScoreResponse.parse(updated));
});

router.delete("/scores/:id", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteScoreParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [deleted] = await db
    .delete(scoresTable)
    .where(
      and(
        eq(scoresTable.id, params.data.id),
        eq(scoresTable.userId, dbUser.id),
      ),
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Score not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
