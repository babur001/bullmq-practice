import { payments_queue } from "@/lesson-9/payments.queue";
import { d, db, p } from "@learn-broker/db";

import * as t from "@learn-broker/db/schema/index";

/**
 * One thing i noticed here. When job is failed and is in DLQ, relay still tries to add it to queue while job is already attempted 10 times and landed in failed status
 * So i think we need here some check for if the job is failed already if so do not re-add it everytime
 */
const relayOnce = async () => {
  await db.transaction(async (tx) => {
    // const outbox_rows = await db
    //   .select()
    //   .from(t.outbox)
    //   .where(d.eq(t.outbox.published, false))
    //   // Here for update and skiplocked is not helping much since two relays are so fast that once locked quickly being released
    //   .for("update", { skipLocked: true });

    // Here we should actually add inside db transaction since for update released once transaction is over, and by raw db there is almost no lock
    const outbox_rows = await tx
      .select()
      .from(t.outbox)
      .where(d.eq(t.outbox.published, false))
      // Here for update and skiplocked is not helping much since two relays are so fast that once locked quickly being released
      .for("update", { skipLocked: true });

    for (const row of outbox_rows) {
      const inserted_job = await payments_queue.add(
        "charge",
        { ...(row.payload as object), outbox_id: row.id },
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
