export async function pollUntil<T>(
  fn: () => Promise<T>,
  isReady: (result: T) => boolean,
  { intervalMs = 3000, timeoutMs = 90_000 } = {},
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await fn();
    if (isReady(result)) return result;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`pollUntil timeout setelah ${timeoutMs}ms`);
}