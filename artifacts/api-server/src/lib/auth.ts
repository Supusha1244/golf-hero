import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export async function getOrCreateUser(clerkId: string, email: string) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (existing.length > 0) return existing[0];

  const [newUser] = await db
    .insert(usersTable)
    .values({
      clerkId,
      email,
      role: "user",
    })
    .returning();

  return newUser;
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
