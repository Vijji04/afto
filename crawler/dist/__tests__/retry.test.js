"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const retry_1 = require("../core/retry");
(0, vitest_1.describe)("withRetry", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)("succeeds on first call - no retries, returns result", async () => {
        const fn = vitest_1.vi.fn().mockResolvedValue("success");
        const result = await (0, retry_1.withRetry)(fn);
        (0, vitest_1.expect)(result).toBe("success");
        (0, vitest_1.expect)(fn).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)("fails twice then succeeds - verify called 3 times", async () => {
        const fn = vitest_1.vi
            .fn()
            .mockRejectedValueOnce(new Error("fail"))
            .mockRejectedValueOnce(new Error("fail"))
            .mockResolvedValueOnce("success");
        const promise = (0, retry_1.withRetry)(fn, { maxRetries: 3, delayMs: 100 });
        await vitest_1.vi.runAllTimersAsync();
        const result = await promise;
        (0, vitest_1.expect)(result).toBe("success");
        (0, vitest_1.expect)(fn).toHaveBeenCalledTimes(3);
    });
    (0, vitest_1.it)("always fails - throws after max retries", async () => {
        vitest_1.vi.useRealTimers();
        const fn = vitest_1.vi.fn().mockRejectedValue(new Error("fail"));
        const promise = (0, retry_1.withRetry)(fn, { maxRetries: 2, delayMs: 5 });
        await (0, vitest_1.expect)(promise).rejects.toThrow("fail");
        (0, vitest_1.expect)(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
    (0, vitest_1.it)("respects maxRetries and delayMs options", async () => {
        vitest_1.vi.useRealTimers();
        const fn = vitest_1.vi.fn().mockRejectedValue(new Error("fail"));
        const promise = (0, retry_1.withRetry)(fn, { maxRetries: 1, delayMs: 10 });
        await (0, vitest_1.expect)(promise).rejects.toThrow("fail");
        (0, vitest_1.expect)(fn).toHaveBeenCalledTimes(2); // initial + 1 retry
    });
});
