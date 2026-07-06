import { connection } from "@/bullmq/connection";
import { Worker } from "bullmq";

new Worker(
  "reminder",
  async (job) => {
    console.log(job.data);
  },
  { connection: connection },
);
