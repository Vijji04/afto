"use client";

import Link from "next/link";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { ProductGrid } from "@/components/organisms/ProductGrid";
import { CategorySidebar } from "@/components/organisms/CategorySidebar";
import type { Product, Category, Pagination } from "@/types";

interface SearchTemplateProps {
  products: Product[];
  categories: Category[];
  query: string;
  pagination: Pagination;
  sort?: string;
  selectedCategory?: string;
}

export function SearchTemplate({
  products,
  categories,
  query,
  pagination,
  sort,
  selectedCategory,
}: SearchTemplateProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-serif text-2xl font-bold text-chocolate mb-2">
          {query
            ? <>Results for &ldquo;{query}&rdquo;</>
            : "All Products"}
        </h1>
        <p className="text-sm text-brown mb-6">
          {pagination.total} product{pagination.total !== 1 ? "s" : ""} found
        </p>

        <div className="flex gap-4 mb-6 flex-wrap">
          {(["relevance", "price_asc", "price_desc"] as const).map((s) => {
            const labels: Record<string, string> = {
              relevance: "Relevance",
              price_asc: "Price: Low to High",
              price_desc: "Price: High to Low",
            };
            const isActive = (sort || "relevance") === s;
            const qs = new URLSearchParams();
            if (query) qs.set("q", query);
            if (selectedCategory) qs.set("category", selectedCategory);
            qs.set("sort", s);
            return (
              <Link
                key={s}
                href={`/search?${qs.toString()}`}
                className={`rounded-md px-3 py-1.5 text-xs transition ${
                  isActive
                    ? "bg-terracotta text-white font-medium"
                    : "border border-beige text-chocolate hover:bg-cream"
                }`}
              >
                {labels[s]}
              </Link>
            );
          })}
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <CategorySidebar
              categories={categories}
              activeCategory={selectedCategory}
            />
          </aside>
          <div className="flex-1">
            <ProductGrid products={products} loading={false} />
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1
                )
                  .slice(
                    Math.max(0, pagination.page - 3),
                    pagination.page + 2
                  )
                  .map((p) => {
                    const qs = new URLSearchParams();
                    if (query) qs.set("q", query);
                    if (selectedCategory) qs.set("category", selectedCategory);
                    if (sort) qs.set("sort", sort);
                    qs.set("page", String(p));
                    return (
                      <Link
                        key={p}
                        href={`/search?${qs.toString()}`}
                        className={`rounded-md px-3 py-1.5 text-sm transition ${
                          p === pagination.page
                            ? "bg-terracotta text-white font-medium"
                            : "border border-beige text-chocolate hover:bg-cream"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
