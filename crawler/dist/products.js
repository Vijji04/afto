"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProductsForCollection = fetchProductsForCollection;
const httpClient_1 = require("./core/httpClient");
async function fetchProductsForCollection(baseUrl, handle) {
    let page = 1;
    const allProducts = [];
    while (true) {
        const url = `${baseUrl}/collections/${handle}/products.json?limit=250&page=${page}`;
        const res = (await (0, httpClient_1.getJSON)(url));
        const products = res.products;
        if (!products || products.length === 0)
            break;
        allProducts.push(...products);
        page++;
    }
    return allProducts;
}
