import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function applicationChunk(id: string) {
  if (id.includes('/src/pages/Home.tsx')) return 'route-home';
  if (id.includes('/src/pages/Services.tsx')) return 'route-services';
  if (id.includes('/src/pages/Products.tsx')) return 'route-products';
  if (id.includes('/src/pages/Articles.tsx')) return 'route-articles';
  if (id.includes('/src/pages/ServiceBooking.tsx')) return 'route-booking';
  if (id.includes('/src/components/product/')) return 'feature-products';
  if (!id.includes('node_modules')) return undefined;
  if (/node_modules\/(?:react|react-dom|react-router|react-router-dom)\//.test(id)) {
    return 'vendor-react';
  }
  if (id.includes('node_modules/@tanstack/')) return 'vendor-query';
  if (id.includes('node_modules/lucide-react/')) return 'vendor-icons';
  if (id.includes('node_modules/zustand/')) return 'vendor-state';
  return undefined;
}

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    manifest: true,
    chunkSizeWarningLimit: 350,
    rolldownOptions: {
      output: {
        manualChunks: applicationChunk,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
