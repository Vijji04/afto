import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { SearchBar } from "@/components/organisms/SearchBar";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/api", () => ({
  getSuggestions: jest.fn(),
}));

import { getSuggestions } from "@/lib/api";
const mockGetSuggestions = getSuggestions as jest.MockedFunction<typeof getSuggestions>;

describe("SearchBar", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGetSuggestions.mockClear();
  });

  it("renders a search input", () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("shows suggestions after typing", async () => {
    mockGetSuggestions.mockResolvedValueOnce({
      suggestions: [
        { id: "1", name: "Aashirvaad Wheat", category: "Atta" },
        { id: "2", name: "Sher Wheat", category: "Atta" },
      ],
    });

    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByPlaceholderText(/search/i), "wheat");

    await waitFor(() => {
      expect(screen.getByText("Aashirvaad Wheat")).toBeInTheDocument();
    });
  });

  it("navigates to search page on form submit", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, "wheat");
    await user.keyboard("{Enter}");

    expect(mockPush).toHaveBeenCalledWith("/search?q=wheat");
  });

  it("navigates to product page on suggestion click", async () => {
    mockGetSuggestions.mockResolvedValueOnce({
      suggestions: [
        { id: "prod-1", name: "Aashirvaad Wheat", category: "Atta" },
      ],
    });

    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByPlaceholderText(/search/i), "wheat");

    await waitFor(() => {
      expect(screen.getByText("Aashirvaad Wheat")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Aashirvaad Wheat"));
    expect(mockPush).toHaveBeenCalledWith("/product/prod-1");
  });
});
