import { greetingQueue } from "@/broker";

await greetingQueue.add("greet", { name: "Ada" });
await greetingQueue.add("greet", { name: "Alan" });
await greetingQueue.add("greet", { name: "Grace" });

await greetingQueue.close();

process.exit(0);
