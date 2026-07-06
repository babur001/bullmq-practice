import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export type TOrderStep = "forward" | "backward";

type TSaleStatus = "pending" | "completed";

export const orders = pgTable("orders", {
  id: uuid().defaultRandom().primaryKey(),
  step: text().$type<TOrderStep>().notNull(),
  status: text().notNull().$type<TSaleStatus>(),
  total_sum: integer().notNull(),
  created_at: timestamp().defaultNow().notNull(),
});

export type TSagaForwardStep =
  | "initial"
  | "in_payment_authorize"
  | "in_warehouse_reserve"
  | "in_shipping"
  | "in_payment_capture"
  | "in_finalize"
  | "completed";

export type TSagaBackwardStep =
  | "initial_return"
  | "in_payment_authorize_return"
  | "in_warehouse_reserve_return"
  | "in_shipping_return"
  | "in_payment_capture_return"
  | "in_finalize_return"
  | "completed_return";

export const saga_outbox = pgTable("saga_outbox", {
  id: serial("id").primaryKey(),
  step: text().notNull().$type<TSagaForwardStep | TSagaBackwardStep>(),
  sale_id: uuid().notNull(),
  is_published: boolean().notNull().default(false),
  created_at: timestamp().defaultNow().notNull(),
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
