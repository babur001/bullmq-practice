export const products_mock: Record<ProductKeys, ProductDetails> = {
  iphone_14: {
    title: "Iphone 14 pro",
    price: 15_000_000,
  },
  macbook_m4_pro: {
    title: "Macbook M4 Pro",
    price: 22_500_000,
  },
  samsung: {
    title: "Samsung S22",
    price: 18_200_000,
  },
  iwatch: {
    title: "Iwatch 8",
    price: 7_500_000,
  },
} as const;

export type ProductDetails = {
  title: string;
  price: number;
};

export type ProductKeys = "iphone_14" | "macbook_m4_pro" | "samsung" | "iwatch";
