import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ProductTemplate } from "@/components/templates/ProductTemplate";
import { CartProvider } from "@/context/CartContext";
import type { Product } from "@/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
  getSuggestions: jest.fn().mockResolvedValue({ suggestions: [] }),
}));

const mockProduct: Product = {
  id: "prod-1",
  name: "Aashirvaad Whole Wheat",
  description: "Premium atta flour, 20lb bag",
  price: 16.99,
  currency: "CAD",
  availability: "in_stock",
  images: ["https://cdn.example.com/img.jpg"],
  category_name: "Atta",
  merchant_name: "Apni Roots",
};

describe("ProductTemplate", () => {
  it("renders product name and description", () => {
    render(
      <CartProvider>
        <ProductTemplate product={mockProduct} />
      </CartProvider>
    );
    expect(screen.getByText("Aashirvaad Whole Wheat")).toBeInTheDocument();
    expect(screen.getByText(/Premium atta flour/)).toBeInTheDocument();
  });

  it("renders price and stock badge", () => {
    render(
      <CartProvider>
        <ProductTemplate product={mockProduct} />
      </CartProvider>
    );
    expect(screen.getByText("$16.99")).toBeInTheDocument();
    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });

  it("has an Add to Cart button", () => {
    render(
      <CartProvider>
        <ProductTemplate product={mockProduct} />
      </CartProvider>
    );
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("adds product to cart on button click", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <ProductTemplate product={mockProduct} />
      </CartProvider>
    );

    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders not found state", () => {
    render(
      <CartProvider>
        <ProductTemplate product={null} />
      </CartProvider>
    );
    expect(screen.getByText(/product not found/i)).toBeInTheDocument();
  });
});
