import { connection } from "@/connection";
import { ledger } from "@/pay/ledger";
import { Worker } from "bullmq";

const pay_queue = new Worker(
  "payments",
  async (job) => {
    throw new Error("Some error...");

    const { saleId, amount, fail } = job.data;

    const locked = await ledger.lockSale(saleId);

    if (!locked) {
      console.log("deduped", amount, saleId);

      return { deduped: true };
    }

    console.log("charged", amount);
    await ledger.charge(saleId);

    if (fail) throw new Error("Some error...");

    return { charged: true };
  },
  { connection: connection },
);

// pay_queue.addListener("", () => {
//   //
// });

pay_queue.on("failed", (job) => {
  if (!job) return;

  console.log(job.failedReason);

  console.log("FAILED: ", job.id, job.data);
});
