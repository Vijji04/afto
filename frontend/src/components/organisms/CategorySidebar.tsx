"use client";

import Link from "next/link";
import type { Category } from "@/types";

interface CategorySidebarProps {
  categories: Category[];
  activeCategory?: string;
}

export function CategorySidebar({ categories, activeCategory }: CategorySidebarProps) {
  return (
    <nav className="space-y-1">
      <h2 className="font-serif text-lg font-bold text-chocolate mb-3">Categories</h2>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${encodeURIComponent(cat.name)}`}
          className={`block rounded-md px-3 py-2 text-sm transition ${
            activeCategory === cat.name
              ? "bg-terracotta text-white font-medium"
              : "text-chocolate hover:bg-cream"
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}
