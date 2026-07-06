import { connection } from "@/bullmq/connection";
import { Queue } from "bullmq";

export const order_queue = new Queue("orders", {
  connection: connection,
  defaultJobOptions: {
    attempts: 3,
  },
});
