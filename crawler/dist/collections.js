"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCollections = fetchCollections;
const httpClient_1 = require("./core/httpClient");
async function fetchCollections(baseUrl) {
    const res = (await (0, httpClient_1.getJSON)(`${baseUrl}/collections.json`));
    return res.collections;
}
