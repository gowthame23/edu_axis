const getEnvValue = (key, fallback) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }

  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  return fallback;
};

const stripTrailingSlash = (value) => String(value || '').replace(/\/$/, '');

export const getApiBaseUrl = () => {
  const envVal = getEnvValue('VITE_API_URL', '');
  if (envVal) return stripTrailingSlash(envVal);
  if (typeof window !== 'undefined' && window.location.origin) {
    if (!window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
      return `${window.location.origin}/api`;
    }
  }
  return 'http://localhost:5000/api';
};

export const getSocketBaseUrl = () => stripTrailingSlash(
  getEnvValue('VITE_SOCKET_URL', getApiBaseUrl().replace(/\/api$/, ''))
);

export const resolveAssetUrl = (assetPath) => {
  if (!assetPath) {
    return '';
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${getSocketBaseUrl()}${normalizedPath}`;
};