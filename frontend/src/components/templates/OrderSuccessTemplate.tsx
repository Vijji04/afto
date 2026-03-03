"use client";

import Link from "next/link";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import type { Order } from "@/types";

interface OrderSuccessTemplateProps {
  order: Order | null;
}

export function OrderSuccessTemplate({ order }: OrderSuccessTemplateProps) {
  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="font-serif text-2xl font-bold text-chocolate mb-4">
            Order not found
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
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-olive/10">
            <span className="text-3xl text-olive">✓</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-chocolate">
            Order Confirmed!
          </h1>
          <p className="mt-2 text-sm text-brown">
            Order #{order.id.slice(0, 8)}
          </p>
        </div>

        <div className="rounded-lg border border-beige bg-white p-6 text-left">
          <h2 className="text-sm font-medium text-chocolate mb-3">
            Order Details
          </h2>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm py-1.5 border-b border-beige last:border-0"
            >
              <span className="text-brown">
                {item.product_name} x{item.quantity}
              </span>
              <span className="text-chocolate font-medium">
                ${Number(item.price_at_purchase).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-base font-bold mt-3 pt-3 border-t border-beige">
            <span className="text-chocolate">Total</span>
            <span className="text-terracotta">
              ${Number(order.total || order.amount).toFixed(2)}
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-terracotta px-8 py-3 text-sm font-medium text-white hover:bg-terracotta/90 transition"
        >
          Continue Shopping
        </Link>
      </main>
      <Footer />
    </div>
  );
}
