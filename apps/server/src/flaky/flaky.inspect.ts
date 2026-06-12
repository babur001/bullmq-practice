import { flakyQueue } from "@/flaky/flaky.queue";

console.log(await flakyQueue.getJobCounts());
const failedJobs = await flakyQueue.getFailed();

failedJobs.map((job) => {
  console.log(job.id);
  console.log(job.failedReason);
});
