"use client";

interface StockBadgeProps {
  availability: string;
}

export function StockBadge({ availability }: StockBadgeProps) {
  const inStock = availability === "in_stock";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        inStock
          ? "bg-olive/10 text-olive"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {inStock ? "In Stock" : "Out of Stock"}
    </span>
  );
}
