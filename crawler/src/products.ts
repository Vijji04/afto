import { getJSON } from "./core/httpClient";
import type { ShopifyProduct } from "./types";

interface ProductsResponse {
  products: ShopifyProduct[];
}

export async function fetchProductsForCollection(
  baseUrl: string,
  handle: string
): Promise<ShopifyProduct[]> {
  let page = 1;
  const allProducts: ShopifyProduct[] = [];

  while (true) {
    const url = `${baseUrl}/collections/${handle}/products.json?limit=250&page=${page}`;
    const res = (await getJSON(url)) as ProductsResponse;
    const products = res.products;

    if (!products || products.length === 0) break;

    allProducts.push(...products);
    page++;
  }

  return allProducts;
}
