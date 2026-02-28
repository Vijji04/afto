"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJSON = getJSON;
const axios_1 = __importDefault(require("axios"));
const retry_1 = require("./retry");
async function getJSON(url) {
    return (0, retry_1.withRetry)(async () => {
        const response = await axios_1.default.get(url);
        return response.data;
    }, { maxRetries: 3, delayMs: 500 });
}
