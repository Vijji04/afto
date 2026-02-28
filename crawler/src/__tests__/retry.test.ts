import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry } from "../core/retry";

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("succeeds on first call - no retries, returns result", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("fails twice then succeeds - verify called 3 times", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("success");

    const promise = withRetry(fn, { maxRetries: 3, delayMs: 100 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("always fails - throws after max retries", async () => {
    vi.useRealTimers();
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    const promise = withRetry(fn, { maxRetries: 2, delayMs: 5 });

    await expect(promise).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("respects maxRetries and delayMs options", async () => {
    vi.useRealTimers();
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    const promise = withRetry(fn, { maxRetries: 1, delayMs: 10 });
    await expect(promise).rejects.toThrow("fail");

    expect(fn).toHaveBeenCalledTimes(2); // initial + 1 retry
  });
});
