/** Ensures only one custom Select dropdown is open at a time (mutual exclusion). */

let openId: string | null = null;
const listeners = new Set<() => void>();

export function getOpenSelectId(): string | null {
  return openId;
}

export function notifySelectOpen(id: string | null): void {
  openId = id;
  listeners.forEach((fn) => fn());
}

export function subscribeSelectOpen(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
