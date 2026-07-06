import { saga_backward_queue, saga_forward_queue } from "@/sale/saga-queues";
import type { ISagaJob } from "@/sale/type";
import { d, db } from "@learn-broker/db";
import * as t from "@learn-broker/db/schema/index";

const relayOnce = async () => {
  const outbox_rows = await db
    .select()
    .from(t.saga_outbox)
    .where(d.eq(t.saga_outbox.is_published, false))
    .innerJoin(t.orders, d.eq(t.orders.id, t.saga_outbox.sale_id))
    .for("update", { skipLocked: true });

  for (const row of outbox_rows) {
    if (!row) return;

    try {
      const is_compensation = row.orders.step === "backward";
      const queue = is_compensation ? saga_backward_queue : saga_forward_queue;

      await queue.add(
        `${row.saga_outbox.step}_${row.saga_outbox.sale_id}`,
        {
          sale_id: row.saga_outbox.sale_id,
          step: row.saga_outbox.step,
          saga_outbox_id: row.saga_outbox.id,
          region: "BERMUD_PYRAMID",
          // "Tashkent",
        } satisfies ISagaJob,
        {
          jobId: `${row.saga_outbox.step}_${row.saga_outbox.sale_id}`,
          attempts: is_compensation ? 50 : 15,
        },
      );

      console.log(`ADD_TO_SAGA_FORWARD_QUEUE:`, row.saga_outbox.step, row.orders.step);

      await db
        .update(t.saga_outbox)
        .set({ is_published: true, step: is_compensation ? "initial_return" : "initial" })
        .where(d.eq(t.saga_outbox.id, row.saga_outbox.id));
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      }
    }
  }
};

setInterval(relayOnce, 1000);
