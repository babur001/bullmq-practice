import { payments_queue } from "@/pay/pay.queue";

await payments_queue.add("charge", { total: 1000 }, { jobId: "sale-1001" });
await payments_queue.add("charge", { total: 1001 }, { jobId: "sale-1001" });
await payments_queue.add("charge", { total: 1002 }, { jobId: "sale-1001" });

console.log("Queue:", await payments_queue.getJobCounts());

// Kept only first one others ignored
