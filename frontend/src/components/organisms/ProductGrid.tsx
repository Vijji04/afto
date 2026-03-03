"use client";

import { ProductCard } from "@/components/molecules/ProductCard";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

function ProductSkeleton() {
  return (
    <div data-testid="product-skeleton" className="animate-pulse rounded-lg border border-beige bg-card">
      <div className="aspect-square bg-beige/50 rounded-t-lg" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 bg-beige/50 rounded" />
        <div className="h-4 w-full bg-beige/50 rounded" />
        <div className="h-4 w-20 bg-beige/50 rounded" />
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading, error, onRetry }: ProductGridProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-destructive mb-3">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta/90 transition"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <p className="text-sm text-brown">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
