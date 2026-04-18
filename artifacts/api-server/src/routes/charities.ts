import { Router } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, charitiesTable } from "@workspace/db";
import {
  ListCharitiesResponse,
  ListCharitiesQueryParams,
  GetCharityParams,
  GetCharityResponse,
  CreateCharityBody,
  UpdateCharityParams,
  UpdateCharityBody,
  UpdateCharityResponse,
  DeleteCharityParams,
  GetMyCharitySelectionResponse,
  UpdateMyCharitySelectionBody,
  UpdateMyCharitySelectionResponse,
} from "@workspace/api-zod";

const router = Router();

function serializeCharity(c: typeof charitiesTable.$inferSelect) {
  return {
    ...c,
    totalReceived: Number(c.totalReceived),
  };
}

router.get("/charities", async (req, res): Promise<void> => {
  const qp = ListCharitiesQueryParams.safeParse(req.query);

  let query = db.select().from(charitiesTable).$dynamic();

  if (qp.success && qp.data.search) {
    query = query.where(ilike(charitiesTable.name, `%${qp.data.search}%`));
  }
  if (qp.success && qp.data.category) {
    query = query.where(
      and(
        qp.data.search ? ilike(charitiesTable.name, `%${qp.data.search}%`) : undefined,
        eq(charitiesTable.category, qp.data.category),
      ),
    );
  }
  if (qp.success && qp.data.featured !== undefined) {
    query = query.where(eq(charitiesTable.featured, qp.data.featured));
  }

  const charities = await db.select().from(charitiesTable);

  let result = charities;
  if (qp.success) {
    if (qp.data.search) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes((qp.data as any).search!.toLowerCase()),
      );
    }
    if (qp.data.category) {
      result = result.filter((c) => c.category === qp.data.category);
    }
    if (qp.data.featured !== undefined) {
      result = result.filter((c) => c.featured === qp.data.featured);
    }
  }

  res.json(ListCharitiesResponse.parse(result.map(serializeCharity)));
});

router.get("/charities/my-selection", async (req, res): Promise<void> => {
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
      GetMyCharitySelectionResponse.parse({
        charityId: null,
        contributionPercent: 10,
      }),
    );
    return;
  }

  let charity = null;
  if (dbUser.charityId) {
    const [found] = await db
      .select()
      .from(charitiesTable)
      .where(eq(charitiesTable.id, dbUser.charityId));
    charity = found ? serializeCharity(found) : null;
  }

  res.json(
    GetMyCharitySelectionResponse.parse({
      charityId: dbUser.charityId,
      charity,
      contributionPercent: dbUser.charityContributionPercent,
    }),
  );
});

router.put("/charities/my-selection", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateMyCharitySelectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  await db
    .update(usersTable)
    .set({
      charityId: parsed.data.charityId,
      charityContributionPercent: parsed.data.contributionPercent,
    })
    .where(eq(usersTable.clerkId, clerkId));

  const [charity] = await db
    .select()
    .from(charitiesTable)
    .where(eq(charitiesTable.id, parsed.data.charityId));

  res.json(
    UpdateMyCharitySelectionResponse.parse({
      charityId: parsed.data.charityId,
      charity: charity ? serializeCharity(charity) : null,
      contributionPercent: parsed.data.contributionPercent,
    }),
  );
});

router.post("/charities", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateCharityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [charity] = await db
    .insert(charitiesTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      website: parsed.data.website,
      category: parsed.data.category,
      featured: parsed.data.featured ?? false,
      upcomingEvent: parsed.data.upcomingEvent,
      upcomingEventDate: parsed.data.upcomingEventDate as string | undefined,
    })
    .returning();

  res.status(201).json(serializeCharity(charity));
});

router.get("/charities/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCharityParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [charity] = await db
    .select()
    .from(charitiesTable)
    .where(eq(charitiesTable.id, params.data.id));

  if (!charity) {
    res.status(404).json({ error: "Charity not found" });
    return;
  }

  res.json(GetCharityResponse.parse(serializeCharity(charity)));
});

router.put("/charities/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateCharityParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateCharityBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(charitiesTable)
    .set({
      name: body.data.name,
      description: body.data.description,
      imageUrl: body.data.imageUrl,
      website: body.data.website,
      category: body.data.category,
      featured: body.data.featured,
      upcomingEvent: body.data.upcomingEvent,
      upcomingEventDate: body.data.upcomingEventDate as string | undefined,
    })
    .where(eq(charitiesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Charity not found" });
    return;
  }

  res.json(UpdateCharityResponse.parse(serializeCharity(updated)));
});

router.delete("/charities/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCharityParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(charitiesTable)
    .where(eq(charitiesTable.id, params.data.id));

  res.sendStatus(204);
});

export default router;
