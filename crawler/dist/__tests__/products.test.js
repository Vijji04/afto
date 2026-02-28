"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const products_1 = require("../products");
const httpClient = __importStar(require("../core/httpClient"));
vitest_1.vi.mock("../core/httpClient");
(0, vitest_1.describe)("fetchProductsForCollection", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.mocked(httpClient.getJSON).mockReset();
    });
    (0, vitest_1.it)("stops paginating when page returns empty, returns accumulated products", async () => {
        const page1Products = [{ id: 1, title: "A" }, { id: 2, title: "B" }];
        vitest_1.vi.mocked(httpClient.getJSON)
            .mockResolvedValueOnce({ products: page1Products })
            .mockResolvedValueOnce({ products: [] });
        const result = await (0, products_1.fetchProductsForCollection)("https://example.com", "atta");
        (0, vitest_1.expect)(result).toHaveLength(2);
        (0, vitest_1.expect)(result).toEqual(page1Products);
        (0, vitest_1.expect)(httpClient.getJSON).toHaveBeenCalledTimes(2);
        (0, vitest_1.expect)(httpClient.getJSON).toHaveBeenNthCalledWith(1, "https://example.com/collections/atta/products.json?limit=250&page=1");
        (0, vitest_1.expect)(httpClient.getJSON).toHaveBeenNthCalledWith(2, "https://example.com/collections/atta/products.json?limit=250&page=2");
    });
    (0, vitest_1.it)("returns empty array when first page is empty", async () => {
        vitest_1.vi.mocked(httpClient.getJSON).mockResolvedValue({ products: [] });
        const result = await (0, products_1.fetchProductsForCollection)("https://example.com", "empty");
        (0, vitest_1.expect)(result).toEqual([]);
        (0, vitest_1.expect)(httpClient.getJSON).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)("accumulates products across multiple pages", async () => {
        const page1 = { products: Array(250).fill({ id: 1 }) };
        const page2 = { products: Array(250).fill({ id: 2 }) };
        const page3 = { products: Array(50).fill({ id: 3 }) };
        vitest_1.vi.mocked(httpClient.getJSON)
            .mockResolvedValueOnce(page1)
            .mockResolvedValueOnce(page2)
            .mockResolvedValueOnce(page3)
            .mockResolvedValueOnce({ products: [] });
        const result = await (0, products_1.fetchProductsForCollection)("https://example.com", "large");
        (0, vitest_1.expect)(result).toHaveLength(550);
        (0, vitest_1.expect)(httpClient.getJSON).toHaveBeenCalledTimes(4);
    });
    (0, vitest_1.it)("uses correct URL format with baseUrl, handle, limit and page", async () => {
        vitest_1.vi.mocked(httpClient.getJSON).mockResolvedValue({ products: [] });
        await (0, products_1.fetchProductsForCollection)("https://shop.ca", "beverages");
        (0, vitest_1.expect)(httpClient.getJSON).toHaveBeenCalledWith("https://shop.ca/collections/beverages/products.json?limit=250&page=1");
    });
});
