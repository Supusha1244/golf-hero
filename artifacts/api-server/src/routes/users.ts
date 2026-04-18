import { Router } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import {
  GetMyProfileResponse,
  UpsertMyProfileBody,
  UpsertMyProfileResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (!user) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(
    GetMyProfileResponse.parse({
      ...user,
      handicap: user.handicap ? Number(user.handicap) : null,
      charityContributionPercent: user.charityContributionPercent,
    }),
  );
});

router.put("/users/me", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpsertMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  let user;
  if (existing.length === 0) {
    const email = (req as any).clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${clerkId}@unknown.com`;
    [user] = await db
      .insert(usersTable)
      .values({
        clerkId,
        email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        handicap: parsed.data.handicap?.toString(),
        role: "user",
      })
      .returning();
  } else {
    [user] = await db
      .update(usersTable)
      .set({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        handicap: parsed.data.handicap?.toString(),
      })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
  }

  res.json(
    UpsertMyProfileResponse.parse({
      ...user,
      handicap: user.handicap ? Number(user.handicap) : null,
    }),
  );
});

export default router;
