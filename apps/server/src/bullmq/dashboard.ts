import { connection } from "@/bullmq/connection";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";

// Read-only handles BY NAME. A Queue instance is just a client pointing at a Redis
// key namespace — creating one here inspects that queue WITHOUT importing the worker
// files (which would start workers or fire jobs on import). Add your saga queues here.
const QUEUE_NAMES = [
  "SAGA_FORWARD_QUEUE",
  "SAGA_BACKWARD_QUEUE",
  // saga task → add e.g. "refund", "release-stock" as you create them
];

const queues = QUEUE_NAMES.map((name) => new Queue(name, { connection }));

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: queues.map((q) => new BullMQAdapter(q)),
  serverAdapter,
});

export const queuesRouter = serverAdapter.getRouter();
