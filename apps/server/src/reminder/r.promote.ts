import { r_queue } from "@/reminder/r.queue";

const job = await r_queue.add(
  "delayed-water",
  { msg: "drink water" },
  { delay: 1000 * 60 * 60 },
);

console.log(await job.getState());
console.log(await r_queue.getJobCounts());

setTimeout(async () => {
  await job.promote();
  const fresh_job = await r_queue.getJob(job.id!);

  console.log(await fresh_job!.getState());

  process.exit(0);
}, 1000);

// Maybe to refresh the dashboard to show up-to-date stats
// We have a redis cache of stats, and a delayed queue where it refreshes the data with actual data from disk (postgres, mongo, kassandra etc.) in every 1 hour
// And if the user is ok with we will show the cached stale data, if not put a button to refresh the the stats (but problem how do we know which job updates specific orgs cache?)
