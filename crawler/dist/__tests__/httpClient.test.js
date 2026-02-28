"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const axios_1 = __importDefault(require("axios"));
const httpClient_1 = require("../core/httpClient");
vitest_1.vi.mock("axios");
(0, vitest_1.describe)("getJSON", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.mocked(axios_1.default.get).mockReset();
    });
    (0, vitest_1.it)("calls axios.get with url and returns response.data", async () => {
        const mockData = { collections: [{ id: 1, handle: "test" }] };
        vitest_1.vi.mocked(axios_1.default.get).mockResolvedValue({ data: mockData });
        const result = await (0, httpClient_1.getJSON)("https://example.com/collections.json");
        (0, vitest_1.expect)(axios_1.default.get).toHaveBeenCalledWith("https://example.com/collections.json");
        (0, vitest_1.expect)(result).toEqual(mockData);
    });
    (0, vitest_1.it)("propagates error on 4xx/5xx or network failure", async () => {
        const err = new Error("Network Error");
        vitest_1.vi.mocked(axios_1.default.get).mockRejectedValue(err);
        await (0, vitest_1.expect)((0, httpClient_1.getJSON)("https://example.com/bad")).rejects.toThrow("Network Error");
    });
    (0, vitest_1.it)("uses withRetry - retries on failure then succeeds", async () => {
        const mockData = { ok: true };
        vitest_1.vi.mocked(axios_1.default.get)
            .mockRejectedValueOnce(new Error("fail"))
            .mockRejectedValueOnce(new Error("fail"))
            .mockResolvedValueOnce({ data: mockData });
        const result = await (0, httpClient_1.getJSON)("https://example.com/retry");
        (0, vitest_1.expect)(axios_1.default.get).toHaveBeenCalledTimes(3);
        (0, vitest_1.expect)(result).toEqual(mockData);
    });
});
