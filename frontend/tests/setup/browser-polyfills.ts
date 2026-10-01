class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/** jsdom lacks the browser APIs MUI and Highcharts probe at render time. */
export function installBrowserPolyfills() {
  if (typeof window === 'undefined') return;
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  if (typeof window.CSS?.supports !== 'function') {
    Object.defineProperty(window, 'CSS', { value: { ...window.CSS, supports: () => false }, writable: true });
  }
  if (!('ResizeObserver' in window)) {
    Object.defineProperty(window, 'ResizeObserver', { value: ResizeObserverStub, writable: true });
  }
}
