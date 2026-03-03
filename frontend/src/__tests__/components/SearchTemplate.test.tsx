import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SearchTemplate } from "@/components/templates/SearchTemplate";
import { CartProvider } from "@/context/CartContext";
import type { Product, Category, Pagination } from "@/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams("q=wheat"),
}));

jest.mock("@/lib/api", () => ({
  getSuggestions: jest.fn().mockResolvedValue({ suggestions: [] }),
}));

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Wheat Atta",
    description: "",
    price: 12.0,
    currency: "CAD",
    availability: "in_stock",
    images: [],
    category: "Atta",
  },
];

const mockCategories: Category[] = [
  { id: "cat-1", name: "Atta", subcategories: [] },
];

const mockPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
};

describe("SearchTemplate", () => {
  it("renders search results", () => {
    render(
      <CartProvider>
        <SearchTemplate
          products={mockProducts}
          categories={mockCategories}
          query="wheat"
          pagination={mockPagination}
        />
      </CartProvider>
    );
    expect(screen.getByText("Wheat Atta")).toBeInTheDocument();
  });

  it("shows the search query", () => {
    render(
      <CartProvider>
        <SearchTemplate
          products={mockProducts}
          categories={mockCategories}
          query="wheat"
          pagination={mockPagination}
        />
      </CartProvider>
    );
    expect(screen.getByText(/wheat/)).toBeInTheDocument();
  });

  it("shows no results state", () => {
    render(
      <CartProvider>
        <SearchTemplate
          products={[]}
          categories={mockCategories}
          query="xyz"
          pagination={{ page: 1, limit: 20, total: 0, totalPages: 0 }}
        />
      </CartProvider>
    );
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });
});
