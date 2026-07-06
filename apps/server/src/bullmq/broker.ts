import { connection } from "@/bullmq/connection";
import { Queue, Worker } from "bullmq";

export const greetingQueue = new Queue("greeting", { connection });
