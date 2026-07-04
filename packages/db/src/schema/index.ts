import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: uuid().defaultRandom().primaryKey(),
  status: text("status")
    .notNull()
    .$type<"pending" | "in_payment" | "cancelled" | "completed">()
    .default("pending"),
  total_sum: integer().notNull(),
  created_at: timestamp().defaultNow().notNull(),
});

export type TSagaStep =
  | "payment_authorize"
  | "warehouse"
  | "shipping"
  | "payment_capture"
  | "finalize"; // completed sets sale as finished and sends notifications

export const saga_outbox = pgTable("saga_outbox", {
  id: serial("id").primaryKey(),
  sale_id: uuid().notNull(),
  is_published: boolean().notNull().default(false),
  created_at: timestamp().defaultNow().notNull(),
  step: text().$type<TSagaStep>().notNull().default("payment_authorize"),
});

/**

export const outbox = pgTable("outbox", {
  id: serial("id").primaryKey(),
  topic: text("topic").$type<"sale">().notNull(),
  status: text("status")
    .$type<"new" | "payment_authorize" | "completed" | "cancelled">()
    .notNull(),
  payload: jsonb("payload").notNull(),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

 */
