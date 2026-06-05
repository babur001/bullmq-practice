import { greetingQueue } from "@/broker";

console.log(await greetingQueue.getJobCounts());

await greetingQueue.add("greet", { name: "Ada" });
await greetingQueue.add("greet", { name: "Alan" });
await greetingQueue.add("greet", { name: "Grace" });

await greetingQueue.close();

process.exit(0);
