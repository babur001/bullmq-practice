import { db } from "@learn-broker/db";
import * as t from "@learn-broker/db/schema/index";

const mock_products = {
  1: 12_000,
  2: 520,
  3: 520,
};

export interface ISagaPayload {
  total_sum: number;
}

const create_sale = async (
  products: { product_id: keyof typeof mock_products; quantity: number }[],
) => {
  return await db.transaction(async (tx) => {
    const total_sum = products.reduce((acc, curr) => {
      acc += curr.quantity * mock_products[curr.product_id];

      return acc;
    }, 0);

    const [new_sale] = await tx
      .insert(t.orders)
      .values({ total_sum, status: "pending", step: "forward" })
      .returning();

    if (!new_sale) throw new Error("FAILED_TO_CREATE_SALE");

    const [outbox] = await tx
      .insert(t.saga_outbox)
      .values({
        sale_id: new_sale.id,
        step: "initial",
        is_published: false,
      })
      .returning();

    if (!outbox) throw new Error("FAILED_TO_CREATE_SAGA");

    return { id: new_sale.id };
  });
};

await create_sale([
  { product_id: 1, quantity: 1 },
  { product_id: 2, quantity: 3 },
]);

process.exit(0);
