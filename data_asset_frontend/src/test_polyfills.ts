import "@testing-library/jest-dom";

/**
 * Jest/jsdom polyfills for browser APIs not available in the Node test environment.
 *
 * The app uses framer-motion's in-view features which depend on IntersectionObserver.
 * Without this, rendering <App /> (LandingPage animations) throws at test runtime.
 */
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.root = options?.root ?? null;
    this.rootMargin = options?.rootMargin ?? "";
    const t = options?.threshold;
    this.thresholds = Array.isArray(t) ? t : t !== undefined ? [t] : [0];
  }

  disconnect(): void {
    // no-op
  }

  observe(_target: Element): void {
    // no-op
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(_target: Element): void {
    // no-op
  }
}

declare global {
  // eslint-disable-next-line no-var
  var IntersectionObserver: typeof IntersectionObserver | undefined;
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}
