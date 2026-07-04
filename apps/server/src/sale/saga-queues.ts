import { connection } from "@/connection";
import { Queue } from "bullmq";

export const saga_forward_queue = new Queue("SAGA_FORWARD_QUEUE", {
  connection,
  defaultJobOptions: { attempts: 15 },
});
export const saga_backward_queue = new Queue("SAGA_BACKWARD_QUEUE", {
  connection,
  defaultJobOptions: { attempts: 15 },
});
