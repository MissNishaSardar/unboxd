import { MIN_ACTION_DELAY_MS } from "@/lib/constants";

// Keeps action buttons in pending state briefly so fast
// responses do not flash the spinner. Resolves with the wrapped promise.
export async function withMinDelay<T>(
  promise: Promise<T>,
  ms = MIN_ACTION_DELAY_MS,
): Promise<T> {
  const [result] = await Promise.all([
    promise,
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]);
  return result;
}
