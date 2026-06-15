import { connection } from "@/connection";
import { s_queue } from "@/scale/s.queue";
import { Worker } from "bullmq";

new Worker(
  "scale",
  async (job) => {
    console.log(`▶ Start: ${job.id} @ ${Date.now() % 100000}`);
    const end = Date.now() + 2000;
    if (process.env.MODE === "cpu") {
      console.log(Date.now(), end);

      while (Date.now() < end) {
        // blocks main thread
      }
    } else {
      await new Promise((r) => setTimeout(r, 0));
    }
    console.log(`■ end: ${job.id} @ ${Date.now() % 100000}`);

    console.log(`===========`);

    return job.id;
  },
  {
    connection: connection,
    concurrency: Number(3),
    limiter: { max: 2, duration: 2000 },
  },
);

// Part A
// CC=5 took far more faster 5x more
// No since I/O task is given to thread and the main thread goes to executing next job, until it reaches max C
// Then starts executing from completed I/O task again and finishes, no wait for I/O to finish

// Part B
// No the split is not guaranteed, first who catches the jobs takes it
// But multiple times running 2 workers always gets 50% share of active jobs 5 one 5 the other

// Part C
// Nope no effect on CC=5, since the code is being executed on main thread, and there is no I/O task here to be awaited and proceded to next job

// To parallelise the cpu intensive task:
// 1. Created 2 worker processes (worked), competing workers
// 2. Span 2 worker processes in terminal
// 3. did not come up with ideas yet, anything else

// Part D
// new Worker(
//   "scale",
//   async (job) => {
//     // Call an rate-limited api
//   },
//   {
//     connection: connection,
//     concurrency: Number(process.env.CC ?? 1),
//     limiter: { max: 3, duration: 1000 },
//   },
// );
