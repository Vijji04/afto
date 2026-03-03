import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CategorySidebar } from "@/components/organisms/CategorySidebar";
import type { Category } from "@/types";

const mockCategories: Category[] = [
  { id: "cat-1", name: "Atta", subcategories: [] },
  { id: "cat-2", name: "Rice", subcategories: [{ id: "sub-1", name: "Basmati" }] },
];

describe("CategorySidebar", () => {
  it("renders all category names", () => {
    render(<CategorySidebar categories={mockCategories} />);
    expect(screen.getByText("Atta")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
  });

  it("links categories to their category pages", () => {
    render(<CategorySidebar categories={mockCategories} />);
    const attaLink = screen.getByRole("link", { name: "Atta" });
    expect(attaLink).toHaveAttribute("href", "/category/Atta");
  });
});
