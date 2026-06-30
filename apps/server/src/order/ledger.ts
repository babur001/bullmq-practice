import { connection } from "@/connection";

const charge = (saleNumber: string | number, total_sum: string | number) => {
  return connection.set(`sales:charged:${saleNumber}`, total_sum, "NX", "GET");
};

export const ledger = {
  charge,
};
