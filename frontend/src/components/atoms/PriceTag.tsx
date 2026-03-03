"use client";

interface PriceTagProps {
  price: number | string;
  currency: string;
  className?: string;
}

export function PriceTag({ price, currency, className = "" }: PriceTagProps) {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  const symbol = currency === "CAD" || currency === "USD" ? "$" : currency;
  return (
    <span className={`font-semibold text-terracotta ${className}`}>
      {symbol}
      {numPrice.toFixed(2)}
    </span>
  );
}
