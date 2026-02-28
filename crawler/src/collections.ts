import { getJSON } from "./core/httpClient";
import type { ShopifyCollection } from "./types";

interface CollectionsResponse {
  collections: ShopifyCollection[];
}

export async function fetchCollections(baseUrl: string): Promise<ShopifyCollection[]> {
  const res = (await getJSON(`${baseUrl}/collections.json`)) as CollectionsResponse;
  return res.collections;
}
