import { Router } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable } from "@workspace/db";
import {
  GetSubscriptionStatusResponse,
  SubscribeBody,
  CancelSubscriptionResponse,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/auth";

const router = Router();

const MONTHLY_AMOUNT = 9.99;
const YEARLY_AMOUNT = 99.99;

function buildStatus(sub: typeof subscriptionsTable.$inferSelect | null) {
  if (!sub) {
    return {
      id: null,
      userId: null,
      plan: null,
      status: "inactive",
      renewalDate: null,
      cancelledAt: null,
      monthlyContributionAmount: 0,
    };
  }
  return {
    id: sub.id,
    userId: sub.userId,
    plan: sub.plan,
    status: sub.status,
    renewalDate: sub.renewalDate?.toISOString() ?? null,
    cancelledAt: sub.cancelledAt?.toISOString() ?? null,
    monthlyContributionAmount:
      sub.plan === "yearly" ? YEARLY_AMOUNT / 12 : MONTHLY_AMOUNT,
  };
}

router.get("/subscriptions/status", async (req, res): Promise<void> => {
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
      GetSubscriptionStatusResponse.parse(buildStatus(null)),
    );
    return;
  }

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, dbUser.id));

  res.json(
    GetSubscriptionStatusResponse.parse(buildStatus(sub ?? null)),
  );
});

router.post("/subscriptions/subscribe", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SubscribeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const dbUser = await getOrCreateUser(clerkId, `${clerkId}@user.com`);

  const renewalDate = new Date();
  if (parsed.data.plan === "yearly") {
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  } else {
    renewalDate.setMonth(renewalDate.getMonth() + 1);
  }

  const amount =
    parsed.data.plan === "yearly"
      ? YEARLY_AMOUNT.toString()
      : MONTHLY_AMOUNT.toString();

  const existing = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, dbUser.id));

  let sub;
  if (existing.length > 0) {
    [sub] = await db
      .update(subscriptionsTable)
      .set({
        plan: parsed.data.plan,
        status: "active",
        renewalDate,
        cancelledAt: null,
        monthlyAmount: amount,
      })
      .where(eq(subscriptionsTable.userId, dbUser.id))
      .returning();
  } else {
    [sub] = await db
      .insert(subscriptionsTable)
      .values({
        userId: dbUser.id,
        plan: parsed.data.plan,
        status: "active",
        renewalDate,
        monthlyAmount: amount,
      })
      .returning();
  }

  res.status(201).json(
    GetSubscriptionStatusResponse.parse(buildStatus(sub)),
  );
});

router.post("/subscriptions/cancel", async (req, res): Promise<void> => {
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
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [sub] = await db
    .update(subscriptionsTable)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, dbUser.id))
    .returning();

  res.json(
    CancelSubscriptionResponse.parse(buildStatus(sub ?? null)),
  );
});

export default router;
