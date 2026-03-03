"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/organisms/SearchBar";
import { useCart } from "@/context/CartContext";

export function Header() {
  const { cartCount } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-beige bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex-shrink-0">
          <span className="font-serif text-2xl font-bold text-terracotta">
            Afto
          </span>
        </Link>

        <div className="flex-1">
          <SearchBar />
        </div>

        <Link
          href="/cart"
          className="relative flex-shrink-0 rounded-lg border border-beige px-4 py-2 text-sm font-medium text-chocolate hover:bg-white transition"
          aria-label="Cart"
        >
          Cart
          {mounted && cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
