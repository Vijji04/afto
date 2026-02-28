import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { getJSON } from "../core/httpClient";

vi.mock("axios");

describe("getJSON", () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  it("calls axios.get with url and returns response.data", async () => {
    const mockData = { collections: [{ id: 1, handle: "test" }] };
    vi.mocked(axios.get).mockResolvedValue({ data: mockData });

    const result = await getJSON("https://example.com/collections.json");

    expect(axios.get).toHaveBeenCalledWith("https://example.com/collections.json");
    expect(result).toEqual(mockData);
  });

  it("propagates error on 4xx/5xx or network failure", async () => {
    const err = new Error("Network Error");
    vi.mocked(axios.get).mockRejectedValue(err);

    await expect(getJSON("https://example.com/bad")).rejects.toThrow("Network Error");
  });

  it("uses withRetry - retries on failure then succeeds", async () => {
    const mockData = { ok: true };
    vi.mocked(axios.get)
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ data: mockData });

    const result = await getJSON("https://example.com/retry");

    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(result).toEqual(mockData);
  });
});
