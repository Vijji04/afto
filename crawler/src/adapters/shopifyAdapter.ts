import type { CanonicalProduct, ShopifyProduct } from "../types";

export function transformProduct(product: ShopifyProduct): CanonicalProduct {
  const variant = product.variants[0];

  return {
    id: String(product.id),
    name: product.title.trim(),
    description: product.body_html?.replace(/<[^>]*>/g, "") || "",
    price: parseFloat(variant.price),
    currency: "CAD",
    images: product.images.map((img) => img.src),
    availability: variant.available ? "in_stock" : "out_of_stock",
  };
}
