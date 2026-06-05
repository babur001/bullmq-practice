import { mathQueue } from "@/math/math.queue";

console.log(await mathQueue.getJobCounts());
console.log("======");

const job = await mathQueue.add("sum", { a: 2, b: 3 });

const result = await job.getState();
// Here printed "active" (sometimes "waiting") since the worker not picked it up yet, even if picked we could not catch it since the step is not syncrhonous
// emit and forget
console.log("result - 1", result);

await new Promise((res) =>
  setTimeout(() => {
    res("success");
  }, 2500),
);

const result2 = await job.getState();
console.log("result - 2", result2);
console.log("result - 2", job.returnvalue);

// Different result of above
const result3 = await mathQueue.getJob(job.id!);
console.log("result - 3", await result3?.getState());
console.log("result - 3", result3?.returnvalue);

console.log("======");
console.log(await mathQueue.getJobCounts());
