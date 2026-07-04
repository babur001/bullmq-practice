import { saga_forward_queue } from "@/sale/saga-queues";
import type { ISagaJob } from "@/sale/type";
import { d, db } from "@learn-broker/db";
import * as t from "@learn-broker/db/schema/index";

const relayOnce = async () => {
  const outbox_rows = await db
    .select()
    .from(t.saga_outbox)
    .where(d.eq(t.saga_outbox.is_published, false))
    .for("update", { skipLocked: true });

  for (const row of outbox_rows) {
    try {
      await saga_forward_queue.add(
        "initial",
        { sale_id: row.sale_id, step: row.step } satisfies ISagaJob,
        { jobId: `saga_forward_${row.id}` },
      );

      console.log(`ADD_TO_SAGA_FORWARD_QUEUE:`, row.step, row.id);

      if (Date.now() % 2 === 0) throw new Error("failed when setting is_published=true");

      await db
        .update(t.saga_outbox)
        .set({ is_published: true })
        .where(d.eq(t.saga_outbox.id, row.id));
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      }
    }
  }
};

setInterval(relayOnce, 1000);
