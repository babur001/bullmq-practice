import { connection } from "@/math/redis-connection";
import { Queue } from "bullmq";

export const mathQueue = new Queue("math", {
  connection: connection,
});
