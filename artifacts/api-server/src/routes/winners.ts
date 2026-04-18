import { Router } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, winnersTable, drawsTable } from "@workspace/db";
import {
  ListWinnersResponse,
  ListWinnersQueryParams,
  VerifyWinnerParams,
  VerifyWinnerBody,
  VerifyWinnerResponse,
  MarkWinnerPaidParams,
  MarkWinnerPaidResponse,
  SubmitWinnerProofBody,
} from "@workspace/api-zod";

const router = Router();

function serializeWinner(
  w: typeof winnersTable.$inferSelect,
  user: { email: string; firstName: string | null; lastName: string | null },
  draw: { month: string; year: number },
) {
  return {
    id: w.id,
    userId: w.userId,
    userEmail: user.email,
    userName:
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : null,
    drawId: w.drawId,
    drawMonth: draw.month,
    drawYear: draw.year,
    matchType: w.matchType,
    prizeAmount: Number(w.prizeAmount),
    proofUrl: w.proofUrl,
    verificationStatus: w.verificationStatus,
    paymentStatus: w.paymentStatus,
    adminNotes: w.adminNotes,
    createdAt: w.createdAt.toISOString(),
  };
}

router.get("/winners", async (req, res): Promise<void> => {
  const qp = ListWinnersQueryParams.safeParse(req.query);

  const rows = await db
    .select({
      winner: winnersTable,
      user: usersTable,
      draw: drawsTable,
    })
    .from(winnersTable)
    .innerJoin(usersTable, eq(winnersTable.userId, usersTable.id))
    .innerJoin(drawsTable, eq(winnersTable.drawId, drawsTable.id));

  let result = rows.map((r) => serializeWinner(r.winner, r.user, r.draw));

  if (qp.success && qp.data.status) {
    result = result.filter((w) => w.verificationStatus === qp.data.status || w.paymentStatus === qp.data.status);
  }

  res.json(ListWinnersResponse.parse(result));
});

router.post("/winners/submit-proof", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SubmitWinnerProofBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [winner] = await db
    .update(winnersTable)
    .set({ proofUrl: parsed.data.proofUrl })
    .where(eq(winnersTable.id, parsed.data.winnerId))
    .returning();

  if (!winner) {
    res.status(404).json({ error: "Winner not found" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, winner.userId));
  const [draw] = await db
    .select()
    .from(drawsTable)
    .where(eq(drawsTable.id, winner.drawId));

  res.status(201).json(serializeWinner(winner, user, draw));
});

router.post("/winners/:id/verify", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = VerifyWinnerParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = VerifyWinnerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [winner] = await db
    .update(winnersTable)
    .set({
      verificationStatus: body.data.status,
      adminNotes: body.data.adminNotes,
    })
    .where(eq(winnersTable.id, params.data.id))
    .returning();

  if (!winner) {
    res.status(404).json({ error: "Winner not found" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, winner.userId));
  const [draw] = await db
    .select()
    .from(drawsTable)
    .where(eq(drawsTable.id, winner.drawId));

  res.json(VerifyWinnerResponse.parse(serializeWinner(winner, user, draw)));
});

router.post("/winners/:id/payout", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = MarkWinnerPaidParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [winner] = await db
    .update(winnersTable)
    .set({ paymentStatus: "paid" })
    .where(eq(winnersTable.id, params.data.id))
    .returning();

  if (!winner) {
    res.status(404).json({ error: "Winner not found" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, winner.userId));
  const [draw] = await db
    .select()
    .from(drawsTable)
    .where(eq(drawsTable.id, winner.drawId));

  res.json(MarkWinnerPaidResponse.parse(serializeWinner(winner, user, draw)));
});

export default router;
