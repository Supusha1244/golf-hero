import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  plan: text("plan").notNull(),
  status: text("status").notNull().default("active"),
  renewalDate: timestamp("renewal_date", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  monthlyAmount: numeric("monthly_amount", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("9.99"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertSubscriptionSchema = createInsertSchema(
  subscriptionsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
