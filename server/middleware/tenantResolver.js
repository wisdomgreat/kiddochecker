const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '10.0.1.4',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'kiddomin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'kiddochecker',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 2000,
  idleTimeoutMillis: 10000,
  max: 3
});

// In-memory domain cache with default known mappings to eliminate redundant DB queries on every request
const domainCache = new Map([
  ['kids.gvachurch.com', { churchId: '00000000-0000-0000-0000-000000000001', language: 'en' }],
  ['kiddochecker.com', { churchId: '00000000-0000-0000-0000-000000000001', language: 'en' }],
  ['happy-glacier-0746a2210.7.azurestaticapps.net', { churchId: '00000000-0000-0000-0000-000000000003', language: 'en' }],
  ['ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io', { churchId: 0, language: 'en' }],
  ['localhost', { churchId: 0, language: 'en' }],
  ['127.0.0.1', { churchId: 0, language: 'en' }]
]);

/**
 * Middleware that extracts the tenant (church) based on the request Host header.
 * Attaches verified tenant metadata to req.tenant for request-scoped isolation.
 */
async function tenantResolver(req, res, next) {
  try {
    const rawHost = req.hostname || (req.headers['x-forwarded-host'] || req.headers.host || '');
    const cleanHost = rawHost.split(':')[0].toLowerCase().trim();

    if (!cleanHost) {
      req.tenant = { churchId: 0, language: 'en' };
      return next();
    }

    if (domainCache.has(cleanHost)) {
      req.tenant = domainCache.get(cleanHost);
      return next();
    }

    // Fast-timeout DB lookup for un-cached hosts
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, language FROM public.churches WHERE LOWER(domain) = $1 LIMIT 1",
        [cleanHost]
      );
      const tenant = result.rows[0];
      const resolved = tenant 
        ? { churchId: tenant.id, language: tenant.language || 'en' }
        : { churchId: 0, language: 'en' };
      domainCache.set(cleanHost, resolved);
      req.tenant = resolved;
    } finally {
      client.release();
    }
    next();
  } catch (err) {
    // Fail-safe fallback: Never block request pipeline if tenant lookup errors or times out
    req.tenant = { churchId: 0, language: 'en' };
    next();
  }
}

module.exports = tenantResolver;

