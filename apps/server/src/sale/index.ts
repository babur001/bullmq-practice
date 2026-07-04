import { createSaleUseCase } from "@/sale/create-sale.use-case";

await createSaleUseCase(["iwatch"]);
console.log("CREATED SALE");

process.exit(0);
