const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || '10.0.1.4',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'kiddomin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'kiddochecker',
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});

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

    const result = await pool.query(
      "SELECT id, language FROM public.churches WHERE LOWER(domain) = $1 LIMIT 1",
      [cleanHost]
    );
    const tenant = result.rows[0];
    if (tenant) {
      req.tenant = { churchId: tenant.id, language: tenant.language || 'en' };
    } else {
      req.tenant = { churchId: 0, language: 'en' };
    }
    next();
  } catch (err) {
    console.error('[TenantResolver] error:', err.message);
    req.tenant = { churchId: 0, language: 'en' };
    next();
  }
}

module.exports = tenantResolver;

