"use client";

import Link from "next/link";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { PriceTag } from "@/components/atoms/PriceTag";
import { StockBadge } from "@/components/atoms/StockBadge";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

interface ProductTemplateProps {
  product: Product | null;
}

export function ProductTemplate({ product }: ProductTemplateProps) {
  const { addItem } = useCart();

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="font-serif text-2xl font-bold text-chocolate mb-4">
            Product not found
          </h1>
          <Link
            href="/"
            className="text-sm text-terracotta hover:text-terracotta/80 underline"
          >
            Back to home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link
          href="/"
          className="inline-block text-sm text-brown hover:text-terracotta transition mb-6"
        >
          &larr; Back to products
        </Link>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square overflow-hidden rounded-lg bg-cream border border-beige">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-brown/40">
                No image available
              </div>
            )}
          </div>
          <div className="space-y-4">
            {(product.category_name || product.category) && (
              <span className="text-xs font-medium uppercase tracking-wide text-saffron">
                {product.category_name || product.category}
              </span>
            )}
            <h1 className="font-serif text-2xl font-bold text-chocolate">
              {product.name}
            </h1>
            <div className="flex items-center gap-3">
              <PriceTag
                price={product.price}
                currency={product.currency}
                className="text-2xl"
              />
              <StockBadge availability={product.availability} />
            </div>
            {product.description && (
              <p className="text-sm text-brown leading-relaxed">
                {product.description}
              </p>
            )}
            {product.merchant_name && (
              <p className="text-xs text-brown/70">
                Sold by {product.merchant_name}
              </p>
            )}
            <button
              onClick={() => addItem(product)}
              disabled={product.availability !== "in_stock"}
              className="mt-4 rounded-lg bg-terracotta px-8 py-3 text-sm font-medium text-white hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
