import { connection } from "@/connection";
import { Queue } from "bullmq";

export const s_queue = new Queue("scale", { connection: connection });
