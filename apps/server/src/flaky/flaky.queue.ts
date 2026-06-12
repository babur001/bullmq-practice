import { connection } from "@/math/redis-connection";
import { Queue } from "bullmq";

export const flakyQueue = new Queue("flaky", {
  connection: connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
});
