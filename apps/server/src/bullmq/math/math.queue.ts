import { connection } from "@/bullmq/math/redis-connection";
import { Queue } from "bullmq";

export const mathQueue = new Queue("math", {
  connection: connection,
  defaultJobOptions: {
    attempts: 4,
    backoff: { type: "exponential", delay: 1000 },
  },
});
