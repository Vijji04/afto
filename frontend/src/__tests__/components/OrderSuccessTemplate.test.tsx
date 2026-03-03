import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OrderSuccessTemplate } from "@/components/templates/OrderSuccessTemplate";
import { CartProvider } from "@/context/CartContext";
import type { Order } from "@/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
  getSuggestions: jest.fn().mockResolvedValue({ suggestions: [] }),
}));

const mockOrder: Order = {
  id: "order-123",
  status: "pending",
  total: "16.99",
  customer_email: "test@test.com",
  customer_name: "Test User",
  created_at: "2025-01-01T00:00:00.000Z",
  items: [
    {
      id: "item-1",
      product_id: "prod-1",
      product_name: "Aashirvaad Wheat",
      quantity: 1,
      price_at_purchase: "16.99",
    },
  ],
};

describe("OrderSuccessTemplate", () => {
  it("renders success message", () => {
    render(
      <CartProvider>
        <OrderSuccessTemplate order={mockOrder} />
      </CartProvider>
    );
    expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
  });

  it("renders order total", () => {
    render(
      <CartProvider>
        <OrderSuccessTemplate order={mockOrder} />
      </CartProvider>
    );
    const totals = screen.getAllByText("$16.99");
    expect(totals.length).toBeGreaterThanOrEqual(1);
  });

  it("renders order items", () => {
    render(
      <CartProvider>
        <OrderSuccessTemplate order={mockOrder} />
      </CartProvider>
    );
    expect(screen.getByText(/Aashirvaad Wheat/)).toBeInTheDocument();
  });

  it("shows error state when order is null", () => {
    render(
      <CartProvider>
        <OrderSuccessTemplate order={null} />
      </CartProvider>
    );
    expect(screen.getByText(/order not found/i)).toBeInTheDocument();
  });
});
