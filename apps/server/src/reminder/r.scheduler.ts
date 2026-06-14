import { r_queue } from "@/reminder/r.queue";

const job = await r_queue.upsertJobScheduler(
  "renew-subscriptions",
  { every: 3000 },
  { name: "renew", data: { source: "babur" } },
);

setInterval(async () => {
  console.log(await r_queue.getJobSchedulers());
}, 1000);

setTimeout(async () => {
  await r_queue.removeJobScheduler("renew-subscriptions");

  process.exit(0);
}, 4000);

// Answers:
// Only one, since upsert is happening. If i modify the content of this file (data property), and run upsert
// the worker will start showing the new data, and only 1 scheduler runs every 3s tih latest data

// delayed in backoff means that job had previously run, but failed and is waiting for its turn to be runned again
// in delay it means the job is fresh and not run before and is waiting to proceed to next phase (waiting)
