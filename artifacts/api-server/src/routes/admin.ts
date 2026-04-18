import { Router } from "express";
import { eq, ilike, count } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, scoresTable } from "@workspace/db";
import {
  ListUsersResponse,
  ListUsersQueryParams,
  GetUserParams,
  GetUserResponse,
  AdminUpdateUserParams,
  AdminUpdateUserBody,
  AdminUpdateUserResponse,
  AdminGetUserScoresParams,
  AdminGetUserScoresResponse,
} from "@workspace/api-zod";

const router = Router();

async function checkAdmin(clerkId: string): Promise<boolean> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  return user?.role === "admin";
}

function serializeUser(u: typeof usersTable.$inferSelect) {
  return {
    ...u,
    handicap: u.handicap ? Number(u.handicap) : null,
  };
}

router.get("/admin/users", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId || !(await checkAdmin(clerkId))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const qp = ListUsersQueryParams.safeParse(req.query);
  const page = qp.success && qp.data.page ? qp.data.page : 1;
  const limit = qp.success && qp.data.limit ? qp.data.limit : 20;
  const offset = (page - 1) * limit;

  let users = await db.select().from(usersTable);

  if (qp.success && qp.data.search) {
    const s = qp.data.search.toLowerCase();
    users = users.filter(
      (u) =>
        u.email.toLowerCase().includes(s) ||
        u.firstName?.toLowerCase().includes(s) ||
        u.lastName?.toLowerCase().includes(s),
    );
  }

  const total = users.length;
  const paginated = users.slice(offset, offset + limit);

  res.json(
    ListUsersResponse.parse({
      users: paginated.map(serializeUser),
      total,
      page,
      limit,
    }),
  );
});

router.get("/admin/users/:clerkId", async (req, res): Promise<void> => {
  const { userId: requesterId } = getAuth(req);
  if (!requesterId || !(await checkAdmin(requesterId))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const clerkId = Array.isArray(req.params.clerkId)
    ? req.params.clerkId[0]
    : req.params.clerkId;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(serializeUser(user)));
});

router.patch("/admin/users/:clerkId", async (req, res): Promise<void> => {
  const { userId: requesterId } = getAuth(req);
  if (!requesterId || !(await checkAdmin(requesterId))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const clerkId = Array.isArray(req.params.clerkId)
    ? req.params.clerkId[0]
    : req.params.clerkId;

  const body = AdminUpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      role: body.data.role,
      firstName: body.data.firstName,
      lastName: body.data.lastName,
    })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(AdminUpdateUserResponse.parse(serializeUser(updated)));
});

router.get("/admin/users/:clerkId/scores", async (req, res): Promise<void> => {
  const { userId: requesterId } = getAuth(req);
  if (!requesterId || !(await checkAdmin(requesterId))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const clerkId = Array.isArray(req.params.clerkId)
    ? req.params.clerkId[0]
    : req.params.clerkId;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const scores = await db
    .select()
    .from(scoresTable)
    .where(eq(scoresTable.userId, user.id));

  res.json(AdminGetUserScoresResponse.parse(scores));
});

export default router;
