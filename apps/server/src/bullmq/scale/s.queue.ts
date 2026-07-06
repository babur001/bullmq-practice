import { connection } from "@/bullmq/connection";
import { Queue } from "bullmq";

export const s_queue = new Queue("scale", { connection: connection });
