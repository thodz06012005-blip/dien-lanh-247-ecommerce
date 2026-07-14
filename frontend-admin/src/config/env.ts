type ApplicationEnvironment = 'development' | 'test' | 'staging' | 'production';

const allowedEnvironments = new Set<ApplicationEnvironment>([
  'development',
  'test',
  'staging',
  'production',
]);

function readUrl(name: keyof ImportMetaEnv, fallback: string): string {
  const value = import.meta.env[name] || fallback;

  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Invalid URL in ${name}: ${value}`);
  }
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Expected boolean environment value, received: ${value}`);
}

function readInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > 120_000) {
    throw new Error(`VITE_API_TIMEOUT_MS must be an integer between 1000 and 120000.`);
  }
  return parsed;
}

const appEnvironment = (import.meta.env.VITE_APP_ENV || 'development') as ApplicationEnvironment;
if (!allowedEnvironments.has(appEnvironment)) {
  throw new Error(`Unsupported VITE_APP_ENV: ${appEnvironment}`);
}

const useMockValue = import.meta.env.VITE_USE_MOCK_API ?? import.meta.env.VITE_USE_MOCK;

export const env = Object.freeze({
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Điện Lạnh 247 - Admin',
  appEnvironment,
  appUrl: readUrl('VITE_APP_URL', 'http://localhost:5174'),
  apiBaseUrl: readUrl('VITE_API_BASE_URL', 'http://localhost:3001/api/v1'),
  apiTimeoutMs: readInteger(import.meta.env.VITE_API_TIMEOUT_MS, 15_000),
  useMockApi: readBoolean(useMockValue, true),
  enableQueryDevtools: readBoolean(import.meta.env.VITE_ENABLE_QUERY_DEVTOOLS, false),
  isDevelopment: appEnvironment === 'development',
  isProduction: appEnvironment === 'production',
});

export type AdminEnvironment = typeof env;
