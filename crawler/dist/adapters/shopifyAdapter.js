"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformProduct = transformProduct;
function transformProduct(product, category, source) {
    const variant = product.variants[0];
    return {
        source,
        source_id: String(product.id),
        name: product.title.trim(),
        description: product.body_html?.replace(/<[^>]*>/g, "") || "",
        price: parseFloat(variant.price),
        currency: "CAD",
        images: product.images.map((img) => img.src),
        availability: variant.available ? "in_stock" : "out_of_stock",
        category,
        subcategory: null,
    };
}
