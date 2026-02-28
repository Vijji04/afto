"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const collections_1 = require("../collections");
const httpClient = __importStar(require("../core/httpClient"));
vitest_1.vi.mock("../core/httpClient");
(0, vitest_1.describe)("fetchCollections", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.mocked(httpClient.getJSON).mockReset();
    });
    (0, vitest_1.it)("calls getJSON with correct collections URL", async () => {
        vitest_1.vi.mocked(httpClient.getJSON).mockResolvedValue({ collections: [] });
        await (0, collections_1.fetchCollections)("https://bombaygrocers.ca");
        (0, vitest_1.expect)(httpClient.getJSON).toHaveBeenCalledWith("https://bombaygrocers.ca/collections.json");
    });
    (0, vitest_1.it)("returns collections from response", async () => {
        const collections = [
            { id: 1, title: "Atta", handle: "atta" },
            { id: 2, title: "Beverages", handle: "beverages" },
        ];
        vitest_1.vi.mocked(httpClient.getJSON).mockResolvedValue({ collections });
        const result = await (0, collections_1.fetchCollections)("https://example.com");
        (0, vitest_1.expect)(result).toEqual(collections);
    });
});
