import { connection } from "@/connection";
import { Queue, Worker } from "bullmq";

export const notification_queue = new Queue("notification", { connection });

// NOTIFICATION SERVICE IS DOWN FOR NOW
// new Worker(
//   "notification",
//   async (job) => {
//     console.log("HANDLING notification...");
//   },
//   { connection },
// );
