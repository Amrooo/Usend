import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/leaflet-init';

// Suppress noisy browser extension background stream logs (e.g., MetaMask/Web3 contentscript ObjectMultiplex)
const originalWarn = console.warn;
console.warn = function (...args: any[]) {
  const msg = args.map(a => (typeof a === 'string' ? a : '')).join(' ');
  if (msg.includes('ObjectMultiplex') || msg.includes('liveness') || msg.includes('MaxListenersExceededWarning')) {
    return;
  }
  originalWarn.apply(console, args);
};

// Patch fetch to bypass Nginx strict static routing on Cloudways
const originalFetch = window.fetch;
window.fetch = async function () {
  let [resource, config] = arguments;
  if (typeof resource === 'string' && resource.startsWith('/api/')) {
    resource = '/api.php?path=' + encodeURIComponent(resource);
  }
  return originalFetch.apply(this, [resource, config]);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
