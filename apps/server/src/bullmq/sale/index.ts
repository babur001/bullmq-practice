import { createSaleUseCase } from "@/bullmq/sale/create-sale.use-case";

await createSaleUseCase(["iwatch"]);
console.log("CREATED SALE");

process.exit(0);
