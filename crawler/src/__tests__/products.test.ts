import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchProductsForCollection } from "../products";
import * as httpClient from "../core/httpClient";

vi.mock("../core/httpClient");

describe("fetchProductsForCollection", () => {
  beforeEach(() => {
    vi.mocked(httpClient.getJSON).mockReset();
  });

  it("stops paginating when page returns empty, returns accumulated products", async () => {
    const page1Products = [{ id: 1, title: "A" }, { id: 2, title: "B" }];
    vi.mocked(httpClient.getJSON)
      .mockResolvedValueOnce({ products: page1Products })
      .mockResolvedValueOnce({ products: [] });

    const result = await fetchProductsForCollection(
      "https://example.com",
      "atta"
    );

    expect(result).toHaveLength(2);
    expect(result).toEqual(page1Products);
    expect(httpClient.getJSON).toHaveBeenCalledTimes(2);
    expect(httpClient.getJSON).toHaveBeenNthCalledWith(
      1,
      "https://example.com/collections/atta/products.json?limit=250&page=1"
    );
    expect(httpClient.getJSON).toHaveBeenNthCalledWith(
      2,
      "https://example.com/collections/atta/products.json?limit=250&page=2"
    );
  });

  it("returns empty array when first page is empty", async () => {
    vi.mocked(httpClient.getJSON).mockResolvedValue({ products: [] });

    const result = await fetchProductsForCollection(
      "https://example.com",
      "empty"
    );

    expect(result).toEqual([]);
    expect(httpClient.getJSON).toHaveBeenCalledTimes(1);
  });

  it("accumulates products across multiple pages", async () => {
    const page1 = { products: Array(250).fill({ id: 1 }) };
    const page2 = { products: Array(250).fill({ id: 2 }) };
    const page3 = { products: Array(50).fill({ id: 3 }) };
    vi.mocked(httpClient.getJSON)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2)
      .mockResolvedValueOnce(page3)
      .mockResolvedValueOnce({ products: [] });

    const result = await fetchProductsForCollection(
      "https://example.com",
      "large"
    );

    expect(result).toHaveLength(550);
    expect(httpClient.getJSON).toHaveBeenCalledTimes(4);
  });

  it("uses correct URL format with baseUrl, handle, limit and page", async () => {
    vi.mocked(httpClient.getJSON).mockResolvedValue({ products: [] });

    await fetchProductsForCollection("https://shop.ca", "beverages");

    expect(httpClient.getJSON).toHaveBeenCalledWith(
      "https://shop.ca/collections/beverages/products.json?limit=250&page=1"
    );
  });
});
