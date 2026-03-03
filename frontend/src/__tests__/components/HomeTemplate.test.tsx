import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HomeTemplate } from "@/components/templates/HomeTemplate";
import { CartProvider } from "@/context/CartContext";
import type { Product, Category } from "@/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
  getSuggestions: jest.fn().mockResolvedValue({ suggestions: [] }),
}));

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Test Product",
    description: "",
    price: 10.0,
    currency: "CAD",
    availability: "in_stock",
    images: [],
    category_name: "Atta",
  },
];

const mockCategories: Category[] = [
  { id: "cat-1", name: "Atta", subcategories: [] },
];

describe("HomeTemplate", () => {
  it("renders the product grid with products", () => {
    render(
      <CartProvider>
        <HomeTemplate products={mockProducts} categories={mockCategories} />
      </CartProvider>
    );
    expect(screen.getByText("Test Product")).toBeInTheDocument();
  });

  it("renders the category sidebar", () => {
    render(
      <CartProvider>
        <HomeTemplate products={mockProducts} categories={mockCategories} />
      </CartProvider>
    );
    expect(screen.getByText("Categories")).toBeInTheDocument();
    const attaLink = screen.getByRole("link", { name: "Atta" });
    expect(attaLink).toBeInTheDocument();
  });

  it("renders the header", () => {
    render(
      <CartProvider>
        <HomeTemplate products={mockProducts} categories={mockCategories} />
      </CartProvider>
    );
    expect(screen.getByText("Afto")).toBeInTheDocument();
  });
});
