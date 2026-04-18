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

export const winnersTable = pgTable("winners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  drawId: integer("draw_id").notNull(),
  matchType: text("match_type").notNull(),
  prizeAmount: numeric("prize_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  proofUrl: text("proof_url"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertWinnerSchema = createInsertSchema(winnersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
export type Winner = typeof winnersTable.$inferSelect;
