import { db } from "@learn-broker/db";
import * as t from "@learn-broker/db/schema/index";

const mock_products = {
  1: 12_000,
  2: 520,
  3: 520,
};

const create_sale = async (
  products: { product_id: keyof typeof mock_products; quantity: number }[],
) => {
  return await db.transaction(async (tx) => {
    const total_sum = products.reduce((acc, curr) => {
      acc += curr.quantity * mock_products[curr.product_id];

      return acc;
    }, 0);

    // process.exit(1);

    const [new_sale] = await tx.insert(t.orders).values({ total: total_sum }).returning();

    if (!new_sale) throw new Error("FAILED_TO_CREATE_SALE");

    const [outbox] = await tx
      .insert(t.outbox)
      .values({
        payload: { products, total_sum, sale_id: new_sale.id },
        topic: "charge",
        published: false,
      })
      .returning();

    if (!outbox) throw new Error("FAILED_TO_CREATE_SALE");

    // process.exit(1);

    return { id: new_sale.id };
  });
};

await Promise.all(
  new Array(300).fill("").map(() => {
    return create_sale([
      { product_id: 1, quantity: 1 },
      { product_id: 2, quantity: 3 },
    ]);
  }),
);

process.exit(0);
