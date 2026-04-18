import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const drawsTable = pgTable("draws", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull().default("upcoming"),
  drawType: text("draw_type").notNull().default("random"),
  winningNumbers: text("winning_numbers"),
  jackpotRolledOver: boolean("jackpot_rolled_over").notNull().default(false),
  jackpotAmount: numeric("jackpot_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  totalPool: numeric("total_pool", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  participantCount: integer("participant_count").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertDrawSchema = createInsertSchema(drawsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDraw = z.infer<typeof insertDrawSchema>;
export type Draw = typeof drawsTable.$inferSelect;
