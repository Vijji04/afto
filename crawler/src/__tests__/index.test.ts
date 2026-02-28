import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { scrape } from "../index";
import * as collections from "../collections";
import * as products from "../products";
import * as shopifyAdapter from "../adapters/shopifyAdapter";
import type { CanonicalProduct, CategoryGroup } from "../types";

vi.mock("../collections");
vi.mock("../products");
vi.mock("../adapters/shopifyAdapter");

describe("scrape", () => {
  const mockCanonicalProduct: CanonicalProduct = {
    id: "1",
    name: "Test Product",
    description: "Desc",
    price: 9.99,
    currency: "CAD",
    images: [],
    availability: "in_stock",
  };

  beforeEach(() => {
    vi.mocked(collections.fetchCollections).mockResolvedValue([
      { id: 1, title: "Beverages", handle: "beverages" },
    ]);
    vi.mocked(products.fetchProductsForCollection).mockResolvedValue([
      { id: 1, title: "Product", variants: [{ price: "9.99", available: true }], images: [] } as any,
    ]);
    vi.mocked(shopifyAdapter.transformProduct).mockReturnValue(mockCanonicalProduct);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
  });

  it("fetches collections and products for each collection", async () => {
    await scrape();

    expect(collections.fetchCollections).toHaveBeenCalled();
    expect(products.fetchProductsForCollection).toHaveBeenCalledWith(
      expect.any(String),
      "beverages"
    );
  });

  it("writes CategoryGroup array to output/products_canonical.json", async () => {
    await scrape();

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "output/products_canonical.json",
      expect.stringContaining('"category": "Beverages"'),
      "utf-8"
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "output/products_canonical.json",
      expect.stringContaining('"products"'),
      "utf-8"
    );
  });

  it("produces CategoryGroup array with category, subcategory, products", async () => {
    await scrape();

    const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
    const written = JSON.parse(writeCall[1] as string) as CategoryGroup[];

    expect(written).toHaveLength(1);
    expect(written[0]).toEqual({
      category: "Beverages",
      subcategory: null,
      products: [mockCanonicalProduct],
    });
  });
});
