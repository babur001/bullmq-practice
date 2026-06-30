import { QueueEvents } from "bullmq";
import { connection } from "@/connection";

const events = new QueueEvents("payments", { connection });

events.on("completed", ({ jobId, returnvalue, prev }, id) => {
  console.log(`job ${jobId} finished with`, returnvalue);
  console.log(prev, id);
});

events.on("failed", ({ jobId, failedReason }) => {
  console.log(`job ${jobId} failed:`, failedReason);
});
