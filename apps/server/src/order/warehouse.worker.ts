import { connection } from "@/connection";
import { Queue, Worker } from "bullmq";

export const warehouse_queue = new Queue("warehouse", { connection });

const worker = new Worker(
  "warehouse",
  async (job) => {
    console.log("HANDLING warehouse...");
  },
  { connection },
);

worker.on("error", (err) => {
  console.log(err);
});

worker.on("failed", (err) => {
  console.log(err);
});
