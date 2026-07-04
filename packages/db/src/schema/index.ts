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
  id: serial("id").primaryKey(),
  topic: text("topic").$type<"sale">().notNull(),
  status: text("status")
    .$type<"new" | "payment_authorize" | "completed" | "cancelled">()
    .notNull(),
  payload: jsonb("payload").notNull(),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sagas = pgTable("sagas", {
  id: serial("id").primaryKey(),
  status: text().notNull().default("sale_created"),
  published: boolean().notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

//
//
//
//
//
//
//
//
//
//
//
//
//

// // ── Lesson 10: Saga ─────────────────────────────────────────────────────────
// // The saga's *persisted state machine*. `status` is the state; `reservationId`
// // and `authId` are the reversible HOLDS a compensation needs to undo (delete
// // the reservation, void the auth). `captured` proves whether money actually
// // moved — the whole point of the pattern is that a cancelled saga has
// // captured=false: we only ever voided a hold, never had to refund.
// export const saga_orders = pgTable("saga_orders", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   status: text("status")
//     .$type<
//       | "created"
//       | "reserved"
//       | "authorized"
//       | "shipped"
//       | "completed"
//       | "compensating"
//       | "cancelled"
//     >()
//     .notNull()
//     .default("created"),
//   total: integer("total").notNull(),
//   address: text("address").notNull(), // drives the deliverability outcome in the demo
//   reservationId: text("reservation_id"), // set on reserve, nulled on release_stock
//   authId: text("auth_id"), // set on authorize (a HOLD), nulled on void_auth
//   captured: boolean("captured").notNull().default(false), // only true on the last step
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });

// // The saga outbox — Lesson-9 outbox "pointed in two directions". One row per
// // pending transition, forward (reserve/authorize/ship/capture) OR compensating
// // (void_auth/release_stock). The relay drains it into the right queue.

export type TSagaStep = "authorize" | "ship";

export const saga_outbox = pgTable("saga_outbox", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id").notNull(),
  step: text("step").$type<TSagaStep>().notNull(),
  payload: jsonb("payload").notNull(),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
