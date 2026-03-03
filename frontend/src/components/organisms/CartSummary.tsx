"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { CartItemRow } from "@/components/molecules/CartItemRow";

export function CartSummary() {
  const { cartItems, cartTotal, cartCount, removeItem, updateQuantity, clearCart } =
    useCart();

  if (cartCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-brown mb-4">Your cart is empty</p>
        <Link
          href="/"
          className="rounded-lg bg-terracotta px-6 py-2.5 text-sm font-medium text-white hover:bg-terracotta/90 transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-bold text-chocolate">
          Your Cart ({cartCount} items)
        </h2>
        <button
          onClick={clearCart}
          className="text-xs text-destructive hover:text-destructive/80 transition"
        >
          Clear All
        </button>
      </div>
      <div>
        {cartItems.map((item) => (
          <CartItemRow
            key={item.product.id}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-beige pt-4">
        <span className="text-lg font-bold text-chocolate">Total</span>
        <span className="text-xl font-bold text-terracotta">
          ${cartTotal.toFixed(2)}
        </span>
      </div>
      <Link
        href="/checkout"
        className="mt-4 block w-full rounded-lg bg-terracotta px-6 py-3 text-center text-sm font-medium text-white hover:bg-terracotta/90 transition"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
