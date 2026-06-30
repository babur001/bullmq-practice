import { connection } from "@/connection";
import { Queue } from "bullmq";

export const payments_queue = new Queue("payments", { connection: connection });
