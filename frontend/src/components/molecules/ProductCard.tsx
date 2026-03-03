"use client";

import Link from "next/link";
import { PriceTag } from "@/components/atoms/PriceTag";
import { StockBadge } from "@/components/atoms/StockBadge";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const categoryName = product.category_name || product.category || "";
  return (
    <Link
      href={`/product/${product.id}`}
      className="group block overflow-hidden rounded-lg border border-beige bg-card shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-cream">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brown/40">
            No image
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          {categoryName && (
            <span className="text-xs font-medium text-saffron uppercase tracking-wide">
              {categoryName}
            </span>
          )}
          <StockBadge availability={product.availability} />
        </div>
        <h3 className="text-sm font-medium text-chocolate leading-tight line-clamp-2">
          {product.name}
        </h3>
        <PriceTag price={product.price} currency={product.currency} />
      </div>
    </Link>
  );
}
