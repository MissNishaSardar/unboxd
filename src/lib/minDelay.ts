// Keeps action buttons in their pending state for at least `ms`, so fast
// responses do not flash the spinner. Resolves with the wrapped promise.
export async function withMinDelay<T>(
  promise: Promise<T>,
  ms = 1500,
): Promise<T> {
  const [result] = await Promise.all([
    promise,
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]);
  return result;
}
