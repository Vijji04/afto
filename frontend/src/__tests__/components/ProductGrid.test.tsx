import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProductGrid } from "@/components/organisms/ProductGrid";
import type { Product } from "@/types";

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Product A",
    description: "",
    price: 10.0,
    currency: "CAD",
    availability: "in_stock",
    images: [],
    category_name: "Atta",
  },
  {
    id: "2",
    name: "Product B",
    description: "",
    price: 20.0,
    currency: "CAD",
    availability: "out_of_stock",
    images: [],
    category_name: "Rice",
  },
];

describe("ProductGrid", () => {
  it("renders product cards", () => {
    render(<ProductGrid products={mockProducts} loading={false} />);
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
  });

  it("shows skeleton placeholders when loading", () => {
    render(<ProductGrid products={[]} loading={true} />);
    const skeletons = screen.getAllByTestId("product-skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error message with retry button", () => {
    const onRetry = jest.fn();
    render(
      <ProductGrid
        products={[]}
        loading={false}
        error="Failed to load"
        onRetry={onRetry}
      />
    );
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("shows empty state when no products", () => {
    render(<ProductGrid products={[]} loading={false} />);
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });
});
