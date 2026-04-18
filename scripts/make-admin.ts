import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx scripts/make-admin.ts <email>");
  process.exit(1);
}

const [user] = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.email, email));

if (!user) {
  console.error(`No user found with email: ${email}`);
  console.error("Make sure the user has signed up on the site first.");
  process.exit(1);
}

await db
  .update(usersTable)
  .set({ role: "admin" })
  .where(eq(usersTable.email, email));

console.log(`✅ ${email} has been promoted to admin.`);
console.log(`   User ID: ${user.id}, Clerk ID: ${user.clerkId}`);
process.exit(0);
