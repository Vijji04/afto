"use client";

import type { CartItem } from "@/types";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const subtotal = Number(item.product.price) * item.quantity;
  return (
    <div className="flex items-center gap-4 py-4 border-b border-beige">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-cream">
        {item.product.images?.[0] ? (
          <img
            src={item.product.images[0]}
            alt={item.product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-brown/40">
            No img
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-chocolate truncate">
          {item.product.name}
        </p>
        <p className="text-xs text-brown mt-0.5">
          ${Number(item.product.price).toFixed(2)} each
        </p>
      </div>
      <input
        type="number"
        min={1}
        value={item.quantity}
        onChange={(e) =>
          onUpdateQuantity(item.product.id, Math.max(1, parseInt(e.target.value) || 1))
        }
        className="w-16 rounded border border-beige px-2 py-1 text-center text-sm"
        aria-label={`Quantity for ${item.product.name}`}
      />
      <span className="w-20 text-right text-sm font-semibold text-terracotta">
        ${subtotal.toFixed(2)}
      </span>
      <button
        onClick={() => onRemove(item.product.id)}
        className="text-xs text-destructive hover:text-destructive/80 transition"
        aria-label="Remove"
      >
        Remove
      </button>
    </div>
  );
}
