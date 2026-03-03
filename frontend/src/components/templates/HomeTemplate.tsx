"use client";

import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { ProductGrid } from "@/components/organisms/ProductGrid";
import { CategorySidebar } from "@/components/organisms/CategorySidebar";
import type { Product, Category } from "@/types";

interface HomeTemplateProps {
  products: Product[];
  categories: Category[];
}

export function HomeTemplate({ products, categories }: HomeTemplateProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-serif text-3xl font-bold text-chocolate mb-8">
          Fresh Finds
        </h1>
        <div className="flex gap-8">
          <aside className="hidden lg:block w-56 shrink-0">
            <CategorySidebar categories={categories} />
          </aside>
          <div className="flex-1">
            <ProductGrid products={products} loading={false} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
