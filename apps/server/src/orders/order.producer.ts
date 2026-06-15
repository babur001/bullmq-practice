import { order_queue } from "@/orders/order.queue";

await order_queue.add("create-order", { valid: false, amount: 100 });
await order_queue.add("create-order", { valid: true, amount: 13 });
await order_queue.add("create-order", { valid: false, amount: 52 });
await order_queue.add("create-order", { valid: false, amount: 10 });
await order_queue.add("create-order", { valid: true, amount: 250 });

process.exit(0);
