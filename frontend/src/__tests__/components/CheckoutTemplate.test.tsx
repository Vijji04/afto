import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CheckoutTemplate } from "@/components/templates/CheckoutTemplate";
import { CartProvider, useCart } from "@/context/CartContext";
import type { Product } from "@/types";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/api", () => ({
  getSuggestions: jest.fn().mockResolvedValue({ suggestions: [] }),
  createOrder: jest.fn().mockResolvedValue({
    data: { id: "order-123", status: "pending", total: "16.99" },
  }),
}));

const mockProduct: Product = {
  id: "prod-1",
  name: "Aashirvaad Whole Wheat",
  description: "Premium atta",
  price: 16.99,
  currency: "CAD",
  availability: "in_stock",
  images: [],
  category_name: "Atta",
};

function SetupCart({ children }: { children: React.ReactNode }) {
  const { addItem } = useCart();
  React.useEffect(() => { addItem(mockProduct); }, []);
  return <>{children}</>;
}

describe("CheckoutTemplate", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
  });

  it("shows empty cart redirect when cart is empty", () => {
    render(
      <CartProvider>
        <CheckoutTemplate />
      </CartProvider>
    );
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it("renders checkout form with name and email fields", () => {
    render(
      <CartProvider>
        <SetupCart>
          <CheckoutTemplate />
        </SetupCart>
      </CartProvider>
    );
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders Place Order button", () => {
    render(
      <CartProvider>
        <SetupCart>
          <CheckoutTemplate />
        </SetupCart>
      </CartProvider>
    );
    expect(screen.getByRole("button", { name: /place order/i })).toBeInTheDocument();
  });
});
