import { connection } from "@/connection";
import { Queue, Worker } from "bullmq";

export const shipping_queue = new Queue("shipping", { connection });

new Worker(
  "shipping",
  async (job) => {
    console.log("HANDLING SHIPPING...");
  },
  { connection },
);
