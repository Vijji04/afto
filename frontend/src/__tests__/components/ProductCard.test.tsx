import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProductCard } from "@/components/molecules/ProductCard";
import type { Product } from "@/types";

const mockProduct: Product = {
  id: "prod-1",
  name: "Aashirvaad Whole Wheat",
  description: "Premium atta",
  price: 16.99,
  currency: "CAD",
  availability: "in_stock",
  images: ["https://cdn.example.com/img.jpg"],
  category_name: "Atta",
};

describe("ProductCard", () => {
  it("renders product name", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("Aashirvaad Whole Wheat")).toBeInTheDocument();
  });

  it("renders product price", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("$16.99")).toBeInTheDocument();
  });

  it("renders category name", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("Atta")).toBeInTheDocument();
  });

  it("renders stock badge", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });

  it("renders product image with alt text", () => {
    render(<ProductCard product={mockProduct} />);
    const img = screen.getByAltText("Aashirvaad Whole Wheat");
    expect(img).toBeInTheDocument();
  });

  it("links to product detail page", () => {
    render(<ProductCard product={mockProduct} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/product/prod-1");
  });
});
