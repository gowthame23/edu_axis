import solr from 'solr-node';

let solrClient;

const getSolrConfig = () => ({
  host: process.env.SOLR_HOST || '127.0.0.1',
  port: process.env.SOLR_PORT || '8983',
  core: process.env.SOLR_CORE || 'eduaxis',
  protocol: process.env.SOLR_PROTOCOL || 'http'
});

const isSolrEnabled = () => process.env.SOLR_ENABLED === 'true';

const getSolrBaseUrl = () => {
  const cfg = getSolrConfig();
  return `${cfg.protocol}://${cfg.host}:${cfg.port}/solr/${cfg.core}`;
};

const escapeSolrTerm = (term) => {
  return String(term || '').replace(/([+\-!(){}\[\]^"~*?:\\/]|&&|\|\|)/g, '\\$1');
};

const getClient = () => {
  if (solrClient) {
    return solrClient;
  }

  const config = getSolrConfig();
  solrClient = new solr(config);
  return solrClient;
};

export const searchWithSolr = async ({ term, schoolId, limit = 10, type }) => {
  if (!isSolrEnabled()) {
    return null;
  }

  if (!schoolId) {
    return [];
  }

  const client = getClient();
  const safeTerm = escapeSolrTerm(term);
  const queryText = safeTerm
    ? `text:${safeTerm}* OR name:${safeTerm}* OR title:${safeTerm}* OR code:${safeTerm}*`
    : '*:*';

  const query = client
    .query()
    .q(queryText)
    .addParams({
      wt: 'json',
      rows: Math.min(Number(limit) || 10, 50),
      fq: [
        `schoolId:${schoolId}`,
        ...(type ? [`type:${type}`] : [])
      ]
    });

  return new Promise((resolve, reject) => {
    client.search(query, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result?.response?.docs || []);
    });
  });
};

export const isSolrSearchEnabled = isSolrEnabled;

export const pingSolr = async () => {
  if (!isSolrEnabled()) {
    return { enabled: false, reachable: false };
  }

  const response = await fetch(`${getSolrBaseUrl()}/admin/ping?wt=json`);
  if (!response.ok) {
    throw new Error(`Solr ping failed with status ${response.status}`);
  }

  const payload = await response.json();
  return {
    enabled: true,
    reachable: payload?.status === 'OK'
  };
};

export const deleteSolrByQuery = async (query) => {
  if (!isSolrEnabled()) {
    return { deleted: 0, skipped: true };
  }

  const response = await fetch(`${getSolrBaseUrl()}/update?commit=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delete: { query } })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Solr delete failed: ${response.status} ${text}`);
  }

  return { deleted: 1, skipped: false };
};

export const indexSolrDocuments = async (documents = []) => {
  if (!isSolrEnabled()) {
    return { indexed: 0, skipped: true };
  }

  if (!documents.length) {
    return { indexed: 0, skipped: false };
  }

  const response = await fetch(`${getSolrBaseUrl()}/update?commit=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(documents)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Solr index failed: ${response.status} ${text}`);
  }

  return { indexed: documents.length, skipped: false };
};
