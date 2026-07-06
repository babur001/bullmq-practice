import { products_mock, type ProductKeys } from "@/sale/products.mock";
import { db } from "@learn-broker/db";
import * as t from "@learn-broker/db/schema/index";

export const createSaleUseCase = async (product_ids: ProductKeys[]) => {
  const total_sum = product_ids.reduce((acc, curr) => {
    const product = products_mock[curr];
    acc += product.price;
    return acc;
  }, 0);

  await db.transaction(async (tx) => {
    const [new_sale] = await tx
      .insert(t.orders)
      .values({
        total_sum,
        step: "forward",
        status: "pending",
      })
      .returning();

    if (!new_sale) {
      throw new Error("FAILED_TO_CREATE_SALE");
    }

    const [outbox] = await tx
      .insert(t.saga_outbox)
      .values({
        sale_id: new_sale.id,
        step: "initial",
      })
      .returning();

    if (!outbox) throw new Error("FAILED_TO_CREATE_SAGA");

    return { new_sale_id: new_sale.id };
  });
};
