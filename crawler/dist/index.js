"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrape = scrape;
const fs_1 = __importDefault(require("fs"));
const collections_1 = require("./collections");
const products_1 = require("./products");
const shopifyAdapter_1 = require("./adapters/shopifyAdapter");
const BASE_URL = process.env.BASE_URL || "https://bombaygrocers.ca";
const SOURCE = process.env.SOURCE || "bombaygrocers";
async function scrape() {
    const canonicalProducts = [];
    const collections = await (0, collections_1.fetchCollections)(BASE_URL);
    for (const collection of collections) {
        console.log(`Scraping collection: ${collection.handle}`);
        const rawProducts = await (0, products_1.fetchProductsForCollection)(BASE_URL, collection.handle);
        for (const product of rawProducts) {
            const transformed = (0, shopifyAdapter_1.transformProduct)(product, collection.title, SOURCE);
            canonicalProducts.push(transformed);
        }
    }
    fs_1.default.writeFileSync("output/products_canonical.json", JSON.stringify(canonicalProducts, null, 2), "utf-8");
    console.log(`Total products scraped: ${canonicalProducts.length}`);
}
if (process.env.VITEST !== "true") {
    scrape().catch((err) => {
        console.error("Scrape failed:", err);
        process.exit(1);
    });
}
