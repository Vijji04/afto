import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCollections } from "../collections";
import * as httpClient from "../core/httpClient";

vi.mock("../core/httpClient");

describe("fetchCollections", () => {
  beforeEach(() => {
    vi.mocked(httpClient.getJSON).mockReset();
  });

  it("calls getJSON with correct collections URL", async () => {
    vi.mocked(httpClient.getJSON).mockResolvedValue({ collections: [] });

    await fetchCollections("https://bombaygrocers.ca");

    expect(httpClient.getJSON).toHaveBeenCalledWith(
      "https://bombaygrocers.ca/collections.json"
    );
  });

  it("returns collections from response", async () => {
    const collections = [
      { id: 1, title: "Atta", handle: "atta" },
      { id: 2, title: "Beverages", handle: "beverages" },
    ];
    vi.mocked(httpClient.getJSON).mockResolvedValue({ collections });

    const result = await fetchCollections("https://example.com");

    expect(result).toEqual(collections);
  });
});
