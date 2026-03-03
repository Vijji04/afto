import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PriceTag } from "@/components/atoms/PriceTag";
import { StockBadge } from "@/components/atoms/StockBadge";

describe("PriceTag", () => {
  it("renders price with currency symbol", () => {
    render(<PriceTag price={16.99} currency="CAD" />);
    expect(screen.getByText("$16.99")).toBeInTheDocument();
  });

  it("renders string prices correctly", () => {
    render(<PriceTag price="5.49" currency="CAD" />);
    expect(screen.getByText("$5.49")).toBeInTheDocument();
  });
});

describe("StockBadge", () => {
  it("shows In Stock for in_stock availability", () => {
    render(<StockBadge availability="in_stock" />);
    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });

  it("shows Out of Stock for out_of_stock availability", () => {
    render(<StockBadge availability="out_of_stock" />);
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });
});
