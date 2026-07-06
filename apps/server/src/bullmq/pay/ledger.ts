import { connection } from "@/bullmq/connection";
import { worker } from "@/bullmq/worker";

const lockSale = (saleNumber: string | number) => {
  return connection.set(`ledger:sale_locks:${saleNumber}`, 1, "NX");
};

const charge = (saleNumber: string | number) => {
  return connection.incr(`ledger:charges:${saleNumber}`);
};

export const ledger = {
  lockSale,
  charge,
};
