"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { useCart } from "@/context/CartContext";
import { createCheckoutSession } from "@/lib/api";

function getPlatformFeeLabel(total: number): string {
  if (total > 100) return "10%";
  if (total >= 50) return "15%";
  return "20%";
}

function getPlatformFeeAmount(total: number): number {
  if (total > 100) return Math.round(total * 0.1 * 100) / 100;
  if (total >= 50) return Math.round(total * 0.15 * 100) / 100;
  return Math.round(total * 0.2 * 100) / 100;
}

export function CheckoutTemplate() {
  const { cartItems, cartTotal, cartCount } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (cartCount === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-16 text-center">
          <p className="text-brown mb-4">Your cart is empty</p>
          <Link
            href="/"
            className="text-sm text-terracotta hover:text-terracotta/80 underline"
          >
            Continue Shopping
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const platformFee = getPlatformFeeAmount(cartTotal);
  const feeLabel = getPlatformFeeLabel(cartTotal);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const origin = window.location.origin;
      const result = await createCheckoutSession({
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        customerName: name || undefined,
        customerEmail: email || undefined,
        successUrl: `${origin}/order-success`,
        cancelUrl: `${origin}/checkout`,
      });

      window.location.href = result.data.sessionUrl;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to initiate payment.";
      if (message.includes("not yet enabled")) {
        setError(
          "This merchant is not yet set up for payments. Please try again later."
        );
      } else if (message.includes("same merchant")) {
        setError(
          "Items from different merchants cannot be checked out together. Please update your cart."
        );
      } else if (
        message.startsWith("API error:") ||
        message === "Failed to fetch"
      ) {
        setError("Failed to initiate payment. Please try again.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-serif text-2xl font-bold text-chocolate mb-8">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-chocolate mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-beige px-4 py-2.5 text-sm text-chocolate focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-chocolate mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-beige px-4 py-2.5 text-sm text-chocolate focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              placeholder="your@email.com"
            />
          </div>

          <div className="border-t border-beige pt-4">
            <h2 className="text-sm font-medium text-chocolate mb-3">
              Order Summary
            </h2>
            {cartItems.map((item) => (
              <div
                key={item.product.id}
                className="flex justify-between text-sm py-1"
              >
                <span className="text-brown">
                  {item.product.name} x{item.quantity}
                </span>
                <span className="text-chocolate font-medium">
                  ${(Number(item.product.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm mt-3 pt-3 border-t border-beige">
              <span className="text-brown">Subtotal</span>
              <span className="text-chocolate font-medium">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-brown">
                Platform fee ({feeLabel})
              </span>
              <span className="text-chocolate font-medium">
                ${platformFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-beige">
              <span className="text-chocolate">Total</span>
              <span className="text-terracotta">${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-lg bg-sand/30 p-4 text-center">
            <p className="text-xs text-brown">
              You will be redirected to Stripe&apos;s secure payment page to
              complete your purchase.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-terracotta px-6 py-3 text-sm font-medium text-white hover:bg-terracotta/90 disabled:opacity-50 transition"
          >
            {loading ? "Redirecting to payment..." : "Pay with Stripe"}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
