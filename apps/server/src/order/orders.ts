import { connection } from "@/connection";
import { Queue, QueueEvents } from "bullmq";

const events = new QueueEvents("orders", { connection });

const orders_queue = new Queue("orders", { connection });

const job = await orders_queue.add(
  "order",
  { sale_id: 6, total_sum: 14000 },
  { attempts: 5 },
);
const finished = await job.waitUntilFinished(events);

console.log("Job result:", finished);

await events.close();
process.exit(0);
