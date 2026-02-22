/** In dev, use same host as the page so the app works when opened from another device (e.g. phone on LAN). */
function getApiUrl(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
}

export const environment = {
  production: false,
  apiUrl: getApiUrl(),
};
