type MetricName = 'CLS' | 'FCP' | 'INP' | 'LCP';
type VitalDetail = { name: MetricName; value: number; rating: 'good' | 'needs-improvement' | 'poor'; path: string };

const thresholds: Record<MetricName, [number, number]> = { CLS: [0.1, 0.25], FCP: [1800, 3000], INP: [200, 500], LCP: [2500, 4000] };
const report = (name: MetricName, value: number) => {
  const [good, poor] = thresholds[name];
  const detail: VitalDetail = { name, value: Math.round(value * 1000) / 1000, rating: value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor', path: location.hash || '#/' };
  window.dispatchEvent(new CustomEvent('dl247:web-vital', { detail }));
  if (import.meta.env.DEV) console.info('[Core Web Vital]', detail);
};

export function observeWebVitals() {
  if (!('PerformanceObserver' in window)) return;
  try { new PerformanceObserver(list => list.getEntries().forEach(entry => report('FCP', entry.startTime))).observe({ type: 'paint', buffered: true }); } catch { /* browser does not support paint timing */ }
  try { new PerformanceObserver(list => { const last = list.getEntries().at(-1); if (last) report('LCP', last.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch { /* browser does not support LCP */ }
  try {
    let cls = 0;
    new PerformanceObserver(list => { list.getEntries().forEach(entry => { const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }; if (!shift.hadRecentInput) cls += shift.value; }); report('CLS', cls); }).observe({ type: 'layout-shift', buffered: true });
  } catch { /* browser does not support CLS */ }
  try { new PerformanceObserver(list => { const longest = Math.max(...list.getEntries().map(entry => entry.duration)); if (Number.isFinite(longest)) report('INP', longest); }).observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit); } catch { /* browser does not support Event Timing */ }
}
