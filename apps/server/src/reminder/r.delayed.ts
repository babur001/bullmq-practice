import { r_queue } from "@/reminder/r.queue";

const job = await r_queue.add(
  "delayed-water",
  { msg: "drink water" },
  { delay: 1000 * 60 * 60 },
);

console.log(await job.getState());
console.log(await r_queue.getJobCounts());

setTimeout(async () => {
  const fresh_job = await r_queue.getJob(job.id!);

  console.log(await fresh_job!.getState());

  process.exit(0);
}, 7000);

// when worker is off status: delayed
// started worker immediate execution of expired timestamp events
