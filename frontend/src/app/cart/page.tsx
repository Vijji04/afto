"use client";

import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { CartSummary } from "@/components/organisms/CartSummary";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-serif text-2xl font-bold text-chocolate mb-8">
          Shopping Cart
        </h1>
        <CartSummary />
      </main>
      <Footer />
    </div>
  );
}
