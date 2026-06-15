import { connection } from "@/connection";
import { Queue } from "bullmq";

export const orders_dlq_queue = new Queue("orders-dlq", { connection: connection });
