"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
function withRetry(fn, opts = {}) {
    const { maxRetries = 3, delayMs = 1000 } = opts;
    return new Promise((resolve, reject) => {
        const attempt = (remaining) => {
            fn()
                .then(resolve)
                .catch((err) => {
                if (remaining <= 0) {
                    reject(err);
                    return;
                }
                setTimeout(() => attempt(remaining - 1), delayMs);
            });
        };
        attempt(maxRetries);
    });
}
