import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/leaflet-init';

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
