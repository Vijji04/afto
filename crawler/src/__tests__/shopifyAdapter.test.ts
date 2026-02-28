import { describe, it, expect } from "vitest";
import { transformProduct } from "../adapters/shopifyAdapter";
import type { ShopifyProduct } from "../types";

const baseProduct: ShopifyProduct = {
  id: 123,
  title: "  Test Product  ",
  body_html: "<p>Description with <b>HTML</b></p>",
  variants: [
    {
      id: 1,
      title: "Default",
      price: "19.99",
      available: true,
    },
  ],
  images: [{ id: 1, src: "https://cdn.example.com/img1.jpg" }],
};

describe("transformProduct", () => {
  it("maps full product to CanonicalProduct correctly", () => {
    const result = transformProduct(baseProduct);

    expect(result).toEqual({
      id: "123",
      name: "Test Product",
      description: "Description with HTML",
      price: 19.99,
      currency: "CAD",
      images: ["https://cdn.example.com/img1.jpg"],
      availability: "in_stock",
    });
  });

  it("returns empty string for description when body_html is null/undefined", () => {
    const product = { ...baseProduct, body_html: null };
    const result = transformProduct(product);

    expect(result.description).toBe("");
  });

  it("returns empty array for images when images is empty", () => {
    const product = { ...baseProduct, images: [] };
    const result = transformProduct(product);

    expect(result.images).toEqual([]);
  });

  it("returns out_of_stock when variant.available is false", () => {
    const product = {
      ...baseProduct,
      variants: [{ ...baseProduct.variants[0], available: false }],
    };
    const result = transformProduct(product);

    expect(result.availability).toBe("out_of_stock");
  });

  it("strips HTML from body_html", () => {
    const product = { ...baseProduct, body_html: "<p>Plain text</p>" };
    const result = transformProduct(product);

    expect(result.description).toBe("Plain text");
  });
});
