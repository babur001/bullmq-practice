import type { ISagaPayload } from "@/lesson-9/create-sale";
import { payments_queue } from "@/lesson-9/payments.queue";
import { d, db } from "@learn-broker/db";
import * as t from "@learn-broker/db/schema/index";

const relayOnce = async () => {
  await db.transaction(async (tx) => {
    const outbox_rows = await tx
      .select()
      .from(t.outbox)
      .where(d.eq(t.outbox.published, false))
      .for("update", { skipLocked: true });

    for (const row of outbox_rows) {
      const data = row.payload as ISagaPayload;

      await payments_queue.add(
        "charge",
        { ...data, outbox_id: row.id },
        {
          jobId: `outbox_${row.id}`,
          attempts: 10,
          backoff: { type: "exponential", delay: 2 },
        },
      );

      console.log(`ADDED_TO_QUEUE:`, row.topic, row.id);
    }
  });
};

// Here also, when job is added, immediately before job even starts handling payment, job is re-added, i think we need more grace period here instead of bashing the queue with duplicate jobs where they are already running
setInterval(relayOnce, 1000);
