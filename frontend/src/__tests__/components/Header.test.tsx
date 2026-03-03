import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Header } from "@/components/organisms/Header";
import { CartProvider } from "@/context/CartContext";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("Header", () => {
  it("renders the brand name", () => {
    render(
      <CartProvider>
        <Header />
      </CartProvider>
    );
    expect(screen.getByText("Afto")).toBeInTheDocument();
  });

  it("renders the search bar", () => {
    render(
      <CartProvider>
        <Header />
      </CartProvider>
    );
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("renders a cart link with count", () => {
    render(
      <CartProvider>
        <Header />
      </CartProvider>
    );
    expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();
  });
});
