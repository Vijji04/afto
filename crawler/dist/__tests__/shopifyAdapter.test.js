"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const shopifyAdapter_1 = require("../adapters/shopifyAdapter");
const baseProduct = {
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
(0, vitest_1.describe)("transformProduct", () => {
    (0, vitest_1.it)("maps full product to CanonicalProduct correctly", () => {
        const result = (0, shopifyAdapter_1.transformProduct)(baseProduct, "Beverages", "bombaygrocers");
        (0, vitest_1.expect)(result).toEqual({
            source: "bombaygrocers",
            source_id: "123",
            name: "Test Product",
            description: "Description with HTML",
            price: 19.99,
            currency: "CAD",
            images: ["https://cdn.example.com/img1.jpg"],
            availability: "in_stock",
            category: "Beverages",
            subcategory: null,
        });
    });
    (0, vitest_1.it)("returns empty string for description when body_html is null/undefined", () => {
        const product = { ...baseProduct, body_html: null };
        const result = (0, shopifyAdapter_1.transformProduct)(product, "Food", "myshop");
        (0, vitest_1.expect)(result.description).toBe("");
    });
    (0, vitest_1.it)("returns empty array for images when images is empty", () => {
        const product = { ...baseProduct, images: [] };
        const result = (0, shopifyAdapter_1.transformProduct)(product, "Food", "myshop");
        (0, vitest_1.expect)(result.images).toEqual([]);
    });
    (0, vitest_1.it)("returns out_of_stock when variant.available is false", () => {
        const product = {
            ...baseProduct,
            variants: [{ ...baseProduct.variants[0], available: false }],
        };
        const result = (0, shopifyAdapter_1.transformProduct)(product, "Food", "myshop");
        (0, vitest_1.expect)(result.availability).toBe("out_of_stock");
    });
    (0, vitest_1.it)("uses source from 3rd param in output", () => {
        const result = (0, shopifyAdapter_1.transformProduct)(baseProduct, "Food", "custom-shop");
        (0, vitest_1.expect)(result.source).toBe("custom-shop");
    });
    (0, vitest_1.it)("strips HTML from body_html", () => {
        const product = { ...baseProduct, body_html: "<p>Plain text</p>" };
        const result = (0, shopifyAdapter_1.transformProduct)(product, "Food", "myshop");
        (0, vitest_1.expect)(result.description).toBe("Plain text");
    });
});
