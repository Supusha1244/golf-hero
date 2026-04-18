import { pgTable, serial, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scoresTable = pgTable("scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull(),
  scoreDate: date("score_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertScoreSchema = createInsertSchema(scoresTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scoresTable.$inferSelect;
