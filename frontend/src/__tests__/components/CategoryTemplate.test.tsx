import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CategoryTemplate } from "@/components/templates/CategoryTemplate";
import { CartProvider } from "@/context/CartContext";
import type { Product, Category } from "@/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
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
    category_name: "Atta",
  },
];

const mockCategories: Category[] = [
  { id: "cat-1", name: "Atta", subcategories: [] },
  { id: "cat-2", name: "Rice", subcategories: [] },
];

describe("CategoryTemplate", () => {
  it("renders filtered products", () => {
    render(
      <CartProvider>
        <CategoryTemplate
          products={mockProducts}
          categories={mockCategories}
          categoryName="Atta"
          pagination={{ page: 1, limit: 20, total: 1, totalPages: 1 }}
        />
      </CartProvider>
    );
    expect(screen.getByText("Wheat Atta")).toBeInTheDocument();
  });

  it("shows the category name in heading", () => {
    render(
      <CartProvider>
        <CategoryTemplate
          products={mockProducts}
          categories={mockCategories}
          categoryName="Atta"
          pagination={{ page: 1, limit: 20, total: 1, totalPages: 1 }}
        />
      </CartProvider>
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Atta");
  });

  it("highlights the active category in sidebar", () => {
    render(
      <CartProvider>
        <CategoryTemplate
          products={mockProducts}
          categories={mockCategories}
          categoryName="Atta"
          pagination={{ page: 1, limit: 20, total: 1, totalPages: 1 }}
        />
      </CartProvider>
    );
    const links = screen.getAllByRole("link", { name: "Atta" });
    const sidebarLink = links.find((l) => l.getAttribute("href")?.startsWith("/category/"));
    expect(sidebarLink).toHaveClass("bg-terracotta");
  });
});
