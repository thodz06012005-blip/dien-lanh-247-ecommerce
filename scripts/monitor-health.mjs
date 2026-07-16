const healthUrl =
  process.env.HEALTHCHECK_URL || 'http://127.0.0.1:3000/api/v1/health/ready';
const alertWebhook = process.env.ALERT_WEBHOOK_URL?.trim();
const attempts = Math.max(1, Math.min(10, Number(process.env.HEALTHCHECK_ATTEMPTS || 3)));
const timeoutMs = Math.max(1_000, Math.min(30_000, Number(process.env.HEALTHCHECK_TIMEOUT_MS || 5_000)));

async function check() {
  const startedAt = Date.now();
  const response = await fetch(healthUrl, {
    headers: { Accept: 'application/json', 'User-Agent': 'dl247-health-monitor/1.0' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Health endpoint returned ${response.status}`);
  return { latencyMs: Date.now() - startedAt, body };
}

async function notify(message) {
  if (!alertWebhook) return;
  const response = await fetch(alertWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'dien-lanh-247',
      severity: 'critical',
      message,
      healthUrl,
      timestamp: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Alert webhook returned ${response.status}`);
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const result = await check();
    console.log(`Health check passed in ${result.latencyMs}ms.`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
}

const message = `Health check failed after ${attempts} attempt(s): ${
  lastError instanceof Error ? lastError.message : 'unknown error'
}`;
console.error(message);
try {
  await notify(message);
} catch (error) {
  console.error(
    `Alert delivery failed: ${error instanceof Error ? error.message : 'unknown error'}`,
  );
}
process.exit(1);
