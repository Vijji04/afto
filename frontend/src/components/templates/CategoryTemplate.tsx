"use client";

import Link from "next/link";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { ProductGrid } from "@/components/organisms/ProductGrid";
import { CategorySidebar } from "@/components/organisms/CategorySidebar";
import type { Product, Category, Pagination } from "@/types";

interface CategoryTemplateProps {
  products: Product[];
  categories: Category[];
  categoryName: string;
  pagination: Pagination;
}

export function CategoryTemplate({
  products,
  categories,
  categoryName,
  pagination,
}: CategoryTemplateProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-serif text-3xl font-bold text-chocolate mb-8">
          {categoryName}
        </h1>
        <div className="flex gap-8">
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <CategorySidebar
              categories={categories}
              activeCategory={categoryName}
            />
          </aside>
          <div className="flex-1">
            <ProductGrid products={products} loading={false} />
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, pagination.page - 3),
                    pagination.page + 2
                  )
                  .map((p) => (
                    <Link
                      key={p}
                      href={`/category/${encodeURIComponent(categoryName)}?page=${p}`}
                      className={`rounded-md px-3 py-1.5 text-sm transition ${
                        p === pagination.page
                          ? "bg-terracotta text-white font-medium"
                          : "border border-beige text-chocolate hover:bg-cream"
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
