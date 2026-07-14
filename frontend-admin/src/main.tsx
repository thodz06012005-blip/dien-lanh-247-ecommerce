import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import AppProviders from '@/app/AppProviders';
import '@/index.css';
import '@/styles/design-system.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Unable to start frontend-admin: missing #root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
