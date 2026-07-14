export type NodeEnvironment = 'development' | 'test' | 'staging' | 'production';

const NODE_ENVIRONMENTS = new Set<NodeEnvironment>([
  'development',
  'test',
  'staging',
  'production',
]);

const PLACEHOLDER_MARKERS = ['replace_', 'placeholder', 'change_me', 'example'];

function readString(
  source: Record<string, unknown>,
  name: string,
  options: { fallback?: string; required?: boolean } = {},
): string {
  const rawValue = source[name];
  let value = options.fallback ?? '';

  if (typeof rawValue === 'string') {
    value = rawValue;
  } else if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
    value = String(rawValue);
  } else if (rawValue !== undefined && rawValue !== null) {
    throw new Error(`${name} must be a string, number or boolean value.`);
  }

  const normalized = value.trim();

  if (options.required && normalized.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return normalized;
}

function readInteger(
  source: Record<string, unknown>,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const rawValue = source[name] ?? fallback;
  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }

  return parsed;
}

function readBoolean(source: Record<string, unknown>, name: string, fallback: boolean): boolean {
  const rawValue = source[name];
  if (rawValue === undefined || rawValue === null || rawValue === '') return fallback;
  if (rawValue === true || rawValue === 'true' || rawValue === '1') return true;
  if (rawValue === false || rawValue === 'false' || rawValue === '0') return false;
  throw new Error(`${name} must be true or false.`);
}

function assertStrongSecret(name: string, value: string) {
  if (value.length < 32) {
    throw new Error(`${name} must contain at least 32 characters in staging and production.`);
  }

  const lowerValue = value.toLowerCase();
  if (PLACEHOLDER_MARKERS.some((marker) => lowerValue.includes(marker))) {
    throw new Error(`${name} still contains a placeholder value.`);
  }
}

export function validateEnvironment(source: Record<string, unknown>): Record<string, unknown> {
  const nodeEnvironment = readString(source, 'NODE_ENV', { fallback: 'development' }) as NodeEnvironment;
  if (!NODE_ENVIRONMENTS.has(nodeEnvironment)) {
    throw new Error(`NODE_ENV must be one of: ${Array.from(NODE_ENVIRONMENTS).join(', ')}.`);
  }

  const jwtAccessSecret = readString(source, 'JWT_ACCESS_SECRET', { required: true });
  const jwtRefreshSecret = readString(source, 'JWT_REFRESH_SECRET', { required: true });
  const corsOrigins = readString(source, 'CORS_ORIGINS', {
    fallback:
      'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174',
  });
  const enableDevEndpoints = readBoolean(source, 'ENABLE_DEV_ENDPOINTS', nodeEnvironment === 'development');
  const enableDemoAccounts = readBoolean(source, 'ENABLE_DEMO_ACCOUNTS', nodeEnvironment === 'development');
  const cookieSecure = readBoolean(source, 'COOKIE_SECURE', nodeEnvironment === 'production');

  if (nodeEnvironment === 'staging' || nodeEnvironment === 'production') {
    assertStrongSecret('JWT_ACCESS_SECRET', jwtAccessSecret);
    assertStrongSecret('JWT_REFRESH_SECRET', jwtRefreshSecret);

    if (corsOrigins.split(',').map((origin) => origin.trim()).includes('*')) {
      throw new Error('CORS_ORIGINS must not contain * in staging or production.');
    }
    if (enableDevEndpoints) {
      throw new Error('ENABLE_DEV_ENDPOINTS must be false in staging and production.');
    }
    if (enableDemoAccounts) {
      throw new Error('ENABLE_DEMO_ACCOUNTS must be false in staging and production.');
    }
    if (!cookieSecure) {
      throw new Error('COOKIE_SECURE must be true in staging and production.');
    }
  }

  return {
    ...source,
    NODE_ENV: nodeEnvironment,
    HOST: readString(source, 'HOST', { fallback: '0.0.0.0' }),
    PORT: readInteger(source, 'PORT', 3000, 1, 65_535),
    API_PREFIX: readString(source, 'API_PREFIX', { fallback: 'api/v1' }).replace(/^\/+|\/+$/g, ''),
    LOG_LEVEL: readString(source, 'LOG_LEVEL', { fallback: 'info' }),
    SWAGGER_ENABLED: readBoolean(source, 'SWAGGER_ENABLED', nodeEnvironment !== 'production'),
    TRUST_PROXY: readBoolean(source, 'TRUST_PROXY', false),
    DATABASE_URL: readString(source, 'DATABASE_URL', { required: true }),
    JWT_ACCESS_SECRET: jwtAccessSecret,
    JWT_REFRESH_SECRET: jwtRefreshSecret,
    BCRYPT_SALT_ROUNDS: readInteger(source, 'BCRYPT_SALT_ROUNDS', 10, 8, 15),
    COOKIE_SECURE: cookieSecure,
    COOKIE_SAME_SITE: readString(source, 'COOKIE_SAME_SITE', { fallback: 'lax' }),
    CORS_ORIGINS: corsOrigins,
    THROTTLE_TTL_MS: readInteger(source, 'THROTTLE_TTL_MS', 60_000, 1_000, 3_600_000),
    THROTTLE_LIMIT: readInteger(source, 'THROTTLE_LIMIT', 100, 1, 100_000),
    JSON_BODY_LIMIT: readString(source, 'JSON_BODY_LIMIT', { fallback: '1mb' }),
    URLENCODED_BODY_LIMIT: readString(source, 'URLENCODED_BODY_LIMIT', { fallback: '100kb' }),
    ENABLE_DEV_ENDPOINTS: enableDevEndpoints,
    ENABLE_DEMO_ACCOUNTS: enableDemoAccounts,
    AUDIT_LOG_ENABLED: readBoolean(source, 'AUDIT_LOG_ENABLED', true),
    DANGEROUS_ACTION_CONFIRMATION_REQUIRED: readBoolean(
      source,
      'DANGEROUS_ACTION_CONFIRMATION_REQUIRED',
      true,
    ),
    SOFT_DELETE_ENABLED: readBoolean(source, 'SOFT_DELETE_ENABLED', true),
  };
}
