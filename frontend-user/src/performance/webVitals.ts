type WebVitalName = 'LCP' | 'CLS' | 'INP';

export interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  path: string;
  navigationType?: string;
  measuredAt: string;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface InteractionEntry extends PerformanceEntry {
  duration: number;
  interactionId?: number;
}

const thresholds: Record<WebVitalName, [number, number]> = {
  LCP: [2_500, 4_000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
};

function rating(name: WebVitalName, value: number): WebVitalMetric['rating'] {
  const [good, poor] = thresholds[name];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function navigationType() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return navigation?.type;
}

function publish(name: WebVitalName, rawValue: number) {
  const value = name === 'CLS' ? Number(rawValue.toFixed(3)) : Math.round(rawValue);
  const metric: WebVitalMetric = {
    name,
    value,
    rating: rating(name, value),
    path: window.location.pathname,
    navigationType: navigationType(),
    measuredAt: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent<WebVitalMetric>('dl247:web-vital', { detail: metric }));
  const endpoint = import.meta.env.VITE_WEB_VITALS_ENDPOINT;
  if (!endpoint) return;

  const body = JSON.stringify(metric);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    return;
  }

  void fetch(endpoint, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    credentials: 'omit',
  }).catch(() => undefined);
}

export function startWebVitalsMonitoring() {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;
  const supported = new Set(PerformanceObserver.supportedEntryTypes || []);
  let latestLcp = 0;
  let cls = 0;
  const interactionDurations = new Map<number, number>();

  if (supported.has('largest-contentful-paint')) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries.at(-1);
      if (last) latestLcp = last.startTime;
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  if (supported.has('layout-shift')) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) cls += entry.value;
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  }

  if (supported.has('event')) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as InteractionEntry[]) {
        if (!entry.interactionId) continue;
        const previous = interactionDurations.get(entry.interactionId) || 0;
        interactionDurations.set(entry.interactionId, Math.max(previous, entry.duration));
      }
    });
    observer.observe({ type: 'event', buffered: true, durationThreshold: 40 });
  }

  let reported = false;
  const report = () => {
    if (reported) return;
    reported = true;
    if (latestLcp > 0) publish('LCP', latestLcp);
    publish('CLS', cls);
    const durations = [...interactionDurations.values()].sort((left, right) => left - right);
    if (durations.length) {
      const percentileIndex = Math.max(0, Math.ceil(durations.length * 0.98) - 1);
      publish('INP', durations[percentileIndex]);
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') report();
  }, { once: true });
  window.addEventListener('pagehide', report, { once: true });
}
