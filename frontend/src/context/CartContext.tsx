"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { Product, CartItem } from "@/types";

type CartAction =
  | { type: "ADD_ITEM"; product: Product }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; items: CartItem[] };

interface CartState {
  items: CartItem[];
}

interface CartContextValue {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "afto-cart";

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) => item.product.id === action.product.id,
      );
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === action.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return {
        items: [...state.items, { product: action.product, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter(
          (item) => item.product.id !== action.productId,
        ),
      };
    case "UPDATE_QUANTITY":
      return {
        items: state.items.map((item) =>
          item.product.id === action.productId
            ? { ...item, quantity: action.quantity }
            : item,
        ),
      };
    case "CLEAR_CART":
      return { items: [] };
    case "HYDRATE":
      return { items: action.items };
    default:
      return state;
  }
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: loadCart() });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = state.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  const addItem = (product: Product) => dispatch({ type: "ADD_ITEM", product });

  const removeItem = (productId: string) =>
    dispatch({ type: "REMOVE_ITEM", productId });

  const updateQuantity = (productId: string, quantity: number) =>
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity });

  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  return (
    <CartContext.Provider
      value={{
        cartItems: state.items,
        cartCount,
        cartTotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

export { CartContext };
