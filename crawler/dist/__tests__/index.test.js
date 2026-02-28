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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = __importDefault(require("fs"));
const index_1 = require("../index");
const collections = __importStar(require("../collections"));
const products = __importStar(require("../products"));
const shopifyAdapter = __importStar(require("../adapters/shopifyAdapter"));
vitest_1.vi.mock("../collections");
vitest_1.vi.mock("../products");
vitest_1.vi.mock("../adapters/shopifyAdapter");
(0, vitest_1.describe)("scrape", () => {
    const mockCanonicalProduct = {
        source: "bombaygrocers",
        source_id: "1",
        name: "Test Product",
        description: "Desc",
        price: 9.99,
        currency: "CAD",
        images: [],
        availability: "in_stock",
        category: "Beverages",
        subcategory: null,
    };
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.mocked(collections.fetchCollections).mockResolvedValue([
            { id: 1, title: "Beverages", handle: "beverages" },
        ]);
        vitest_1.vi.mocked(products.fetchProductsForCollection).mockResolvedValue([
            { id: 1, title: "Product", variants: [{ price: "9.99", available: true }], images: [] },
        ]);
        vitest_1.vi.mocked(shopifyAdapter.transformProduct).mockReturnValue(mockCanonicalProduct);
        vitest_1.vi.spyOn(fs_1.default, "writeFileSync").mockImplementation(() => { });
    });
    (0, vitest_1.it)("fetches collections and products for each collection", async () => {
        await (0, index_1.scrape)();
        (0, vitest_1.expect)(collections.fetchCollections).toHaveBeenCalled();
        (0, vitest_1.expect)(products.fetchProductsForCollection).toHaveBeenCalledWith(vitest_1.expect.any(String), "beverages");
    });
    (0, vitest_1.it)("writes canonical products to output/products_canonical.json", async () => {
        await (0, index_1.scrape)();
        (0, vitest_1.expect)(fs_1.default.writeFileSync).toHaveBeenCalledWith("output/products_canonical.json", vitest_1.expect.stringContaining('"source": "bombaygrocers"'), "utf-8");
    });
    (0, vitest_1.it)("produces array of canonical products with correct count", async () => {
        await (0, index_1.scrape)();
        const writeCall = vitest_1.vi.mocked(fs_1.default.writeFileSync).mock.calls[0];
        const written = JSON.parse(writeCall[1]);
        (0, vitest_1.expect)(written).toHaveLength(1);
        (0, vitest_1.expect)(written[0]).toEqual(mockCanonicalProduct);
    });
});
