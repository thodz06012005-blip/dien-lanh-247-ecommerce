import { z } from 'zod';

const environmentSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).default('Điện Lạnh 247'),
  VITE_APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  VITE_APP_URL: z.url().default('http://localhost:5173'),
  VITE_API_BASE_URL: z.url().default('http://localhost:3001/api/v1'),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(15_000),
  VITE_USE_MOCK_API: z.enum(['true', 'false']).optional(),
  VITE_USE_MOCK: z.enum(['true', 'false']).optional(),
  VITE_ENABLE_QUERY_DEVTOOLS: z.enum(['true', 'false']).default('false'),
});

const parsedEnvironment = environmentSchema.safeParse(import.meta.env);

if (!parsedEnvironment.success) {
  const details = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid frontend-user environment configuration:\n${details}`);
}

const raw = parsedEnvironment.data;
const useMockApi = (raw.VITE_USE_MOCK_API ?? raw.VITE_USE_MOCK ?? 'true') === 'true';

export const env = Object.freeze({
  appName: raw.VITE_APP_NAME,
  appEnvironment: raw.VITE_APP_ENV,
  appUrl: raw.VITE_APP_URL,
  apiBaseUrl: raw.VITE_API_BASE_URL.replace(/\/$/, ''),
  apiTimeoutMs: raw.VITE_API_TIMEOUT_MS,
  useMockApi,
  enableQueryDevtools: raw.VITE_ENABLE_QUERY_DEVTOOLS === 'true',
  isDevelopment: raw.VITE_APP_ENV === 'development',
  isProduction: raw.VITE_APP_ENV === 'production',
});

export type CustomerEnvironment = typeof env;
