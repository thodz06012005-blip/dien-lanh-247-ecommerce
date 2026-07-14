/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_ENV?: 'development' | 'test' | 'staging' | 'production';
  readonly VITE_APP_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_USE_MOCK_API?: 'true' | 'false';
  readonly VITE_USE_MOCK?: 'true' | 'false';
  readonly VITE_ENABLE_QUERY_DEVTOOLS?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
