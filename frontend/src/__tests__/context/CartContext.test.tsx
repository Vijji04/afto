import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CartProvider, useCart } from "@/context/CartContext";
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

const mockProduct2: Product = {
  id: "prod-2",
  name: "Tata Salt",
  description: "Iodised salt",
  price: 2.49,
  currency: "CAD",
  availability: "in_stock",
  images: ["https://cdn.example.com/salt.jpg"],
  category_name: "Cooking Essentials",
};

function TestComponent() {
  const { cartItems, cartCount, cartTotal, addItem, removeItem, updateQuantity, clearCart } =
    useCart();

  return (
    <div>
      <span data-testid="count">{cartCount}</span>
      <span data-testid="total">{cartTotal.toFixed(2)}</span>
      <span data-testid="items">{JSON.stringify(cartItems)}</span>
      <button onClick={() => addItem(mockProduct)}>Add Product 1</button>
      <button onClick={() => addItem(mockProduct2)}>Add Product 2</button>
      <button onClick={() => removeItem("prod-1")}>Remove Product 1</button>
      <button onClick={() => updateQuantity("prod-1", 5)}>Set Qty 5</button>
      <button onClick={() => clearCart()}>Clear</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("CartContext", () => {
  it("starts with an empty cart", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("total")).toHaveTextContent("0.00");
  });

  it("adds an item to the cart", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await user.click(screen.getByText("Add Product 1"));

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("total")).toHaveTextContent("16.99");
  });

  it("increments quantity when adding the same item again", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await user.click(screen.getByText("Add Product 1"));
    await user.click(screen.getByText("Add Product 1"));

    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("total")).toHaveTextContent("33.98");
  });

  it("adds multiple different items", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await user.click(screen.getByText("Add Product 1"));
    await user.click(screen.getByText("Add Product 2"));

    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("total")).toHaveTextContent("19.48");
  });

  it("removes an item from the cart", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await user.click(screen.getByText("Add Product 1"));
    await user.click(screen.getByText("Add Product 2"));
    await user.click(screen.getByText("Remove Product 1"));

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("total")).toHaveTextContent("2.49");
  });

  it("updates quantity of an item", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await user.click(screen.getByText("Add Product 1"));
    await user.click(screen.getByText("Set Qty 5"));

    expect(screen.getByTestId("count")).toHaveTextContent("5");
    expect(screen.getByTestId("total")).toHaveTextContent("84.95");
  });

  it("clears the entire cart", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await user.click(screen.getByText("Add Product 1"));
    await user.click(screen.getByText("Add Product 2"));
    await user.click(screen.getByText("Clear"));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("total")).toHaveTextContent("0.00");
  });

  it("persists cart to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await user.click(screen.getByText("Add Product 1"));

    const stored = JSON.parse(localStorage.getItem("afto-cart") || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].product.id).toBe("prod-1");
  });

  it("restores cart from localStorage on mount", () => {
    localStorage.setItem(
      "afto-cart",
      JSON.stringify([{ product: mockProduct, quantity: 3 }])
    );

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId("count")).toHaveTextContent("3");
    expect(screen.getByTestId("total")).toHaveTextContent("50.97");
  });
});
