import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CartSummary } from "@/components/organisms/CartSummary";
import { CartProvider } from "@/context/CartContext";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("CartSummary", () => {
  it("shows empty cart message when cart is empty", () => {
    render(
      <CartProvider>
        <CartSummary />
      </CartProvider>
    );
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});
