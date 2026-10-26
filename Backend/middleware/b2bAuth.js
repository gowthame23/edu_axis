const parseConfiguredKeys = () => {
  const singleKey = process.env.B2B_API_KEY ? [process.env.B2B_API_KEY] : [];
  const multipleKeys = String(process.env.B2B_API_KEYS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return [...new Set([...singleKey, ...multipleKeys])];
};

const getApiKeyFromRequest = (req) => {
  const headerKey = req.headers['x-api-key'];
  if (headerKey) {
    return String(headerKey).trim();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return '';
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() === 'apikey' && token) {
    return String(token).trim();
  }

  return '';
};

export const b2bApiKeyAuth = (req, res, next) => {
  const configuredKeys = parseConfiguredKeys();
  if (!configuredKeys.length) {
    return res.status(503).json({
      success: false,
      message: 'B2B API is not configured. Set B2B_API_KEY or B2B_API_KEYS in environment.'
    });
  }

  const providedKey = getApiKeyFromRequest(req);
  if (!providedKey) {
    return res.status(401).json({
      success: false,
      message: 'Missing API key. Provide x-api-key header or Authorization: ApiKey <key>. School code/id belongs in the URL path, not the header.'
    });
  }

  if (!configuredKeys.includes(providedKey)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  req.b2bClient = {
    keyHash: providedKey.slice(0, 6)
  };

  next();
};
