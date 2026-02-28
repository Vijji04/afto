export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
}

export function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000 } = opts;

  return new Promise((resolve, reject) => {
    const attempt = (remaining: number) => {
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
