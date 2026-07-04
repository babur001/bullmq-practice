CREATE TABLE "saga_outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" uuid NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"step" text DEFAULT 'payment_authorize' NOT NULL
);
--> statement-breakpoint
DROP TABLE "outbox" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_sum" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "total";