import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CartItemRow } from "@/components/molecules/CartItemRow";
import type { CartItem } from "@/types";

const mockCartItem: CartItem = {
  product: {
    id: "prod-1",
    name: "Aashirvaad Whole Wheat",
    description: "Premium atta",
    price: 16.99,
    currency: "CAD",
    availability: "in_stock",
    images: ["https://cdn.example.com/img.jpg"],
    category_name: "Atta",
  },
  quantity: 2,
};

describe("CartItemRow", () => {
  it("renders product name and quantity", () => {
    render(
      <CartItemRow item={mockCartItem} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.getByText("Aashirvaad Whole Wheat")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
  });

  it("renders subtotal", () => {
    render(
      <CartItemRow item={mockCartItem} onUpdateQuantity={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.getByText("$33.98")).toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", async () => {
    const onRemove = jest.fn();
    const user = userEvent.setup();
    render(
      <CartItemRow item={mockCartItem} onUpdateQuantity={jest.fn()} onRemove={onRemove} />
    );

    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith("prod-1");
  });
});
