import { mathQueue } from "@/math/math.queue";
import { connection } from "@/math/redis-connection";
import { QueueEvents } from "bullmq";

const streamMathEvents = new QueueEvents("math", { connection: connection });
await streamMathEvents.waitUntilReady();

const job = await mathQueue.add("sum", { a: 2, b: 2 });
// Here if the worker throws i think the `waitUntilFinished` also throws, and we should be carefull here
const result = await job.waitUntilFinished(streamMathEvents);

console.log("result", result);

await streamMathEvents.close();
await mathQueue.close();
process.exit(0);

// Answer: It breaks the whole point of using brokers. The real reason i would use broker
// is just not to give too much attention to some event, like notifying the user, or sending an SMS
// or resizing the image size. Just throw and forget event.
// If that's not the case i would directly use the sync event, and not propogate that task to other worker
// it would be much easier and logically correct than passing to some other worker and hoping that it will succeed
