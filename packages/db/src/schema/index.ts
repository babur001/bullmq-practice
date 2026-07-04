import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  integer,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status").notNull().default("pending"),
  total: integer("total").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outbox = pgTable("outbox", {
  id: serial("id").primaryKey(), // monotonic → natural ordering + a stable jobId
  topic: text("topic").notNull(), // which queue/event, e.g. "charge"
  payload: jsonb("payload").notNull(), // the job data
  published: boolean("published").notNull().default(false), // the relay's flag
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
