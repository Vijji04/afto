import fs from "fs";
import { fetchCollections } from "./collections";
import { fetchProductsForCollection } from "./products";
import { transformProduct } from "./adapters/shopifyAdapter";
import type { CategoryGroup } from "./types";

const BASE_URL = process.env.BASE_URL || "https://bombaygrocers.ca";

function groupKey(category: string, subcategory: string | null): string {
  return `${category}\0${subcategory ?? ""}`;
}

export async function scrape(): Promise<void> {
  const groupsMap = new Map<string, CategoryGroup>();
  const seenProductIds = new Set<string>();
  const collections = await fetchCollections(BASE_URL);

  for (const collection of collections) {
    console.log(`Scraping collection: ${collection.handle}`);

    const rawProducts = await fetchProductsForCollection(
      BASE_URL,
      collection.handle
    );

    for (const product of rawProducts) {
      const productId = String(product.id);
      if (seenProductIds.has(productId)) continue;
      seenProductIds.add(productId);

      const category = collection.title;
      const subcategory = product.product_type?.trim() || null;
      const key = groupKey(category, subcategory);

      if (!groupsMap.has(key)) {
        groupsMap.set(key, { category, subcategory, products: [] });
      }

      const transformed = transformProduct(product);
      groupsMap.get(key)!.products.push(transformed);
    }
  }

  const categoryGroups: CategoryGroup[] = Array.from(groupsMap.values());
  const totalProducts = categoryGroups.reduce(
    (sum, g) => sum + g.products.length,
    0
  );

  fs.writeFileSync(
    "output/products_canonical.json",
    JSON.stringify(categoryGroups, null, 2),
    "utf-8"
  );

  console.log(`Total products scraped: ${totalProducts}`);
}

if (process.env.VITEST !== "true") {
  scrape().catch((err) => {
    console.error("Scrape failed:", err);
    process.exit(1);
  });
}
