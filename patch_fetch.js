const originalFetch = window.fetch;
window.fetch = async function () {
  let [resource, config] = arguments;
  if (typeof resource === 'string' && resource.startsWith('/api/')) {
    resource = '/api.php?path=' + encodeURIComponent(resource);
  } else if (resource instanceof Request && resource.url.includes('/api/')) {
    // If it's a Request object, this is more complex, but standard fetch calls in the app use strings.
  }
  return originalFetch.apply(this, [resource, config]);
};
