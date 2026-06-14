import { connection } from "@/connection";
import { Worker } from "bullmq";

new Worker(
  "reminder",
  async (job) => {
    console.log(job.data);
  },
  { connection: connection },
);
