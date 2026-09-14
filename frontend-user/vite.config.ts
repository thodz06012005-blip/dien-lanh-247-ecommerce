import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (mode === 'production' && !(env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL)) {
    throw new Error('VITE_API_BASE_URL is required for production builds')
  }
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
