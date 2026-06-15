const { Pool } = require('pg');
const pool = new Pool({
  host: '10.0.1.4',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'kiddomin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'kiddochecker',
  ssl: { rejectUnauthorized: false },
});

/**
 * Middleware that extracts the tenant (church) based on the request Host header.
 * It expects a `churches` lookup table with columns: id, domain, language, branding_json.
 * The resolved church id and language are attached to req.tenant and the PostgreSQL
 * session variables `app.church_id` and `app.language` are set for RLS.
 */
async function tenantResolver(req, res, next) {
  try {
    const host = (req.headers['x-forwarded-host'] || req.headers.host)?.toLowerCase();
    if (!host) return next(); // fallback, no tenant

    const result = await pool.query(
      "SELECT id, language FROM public.churches WHERE LOWER(domain) = $1 LIMIT 1",
      [host]
    );
    const tenant = result.rows[0];
    if (tenant) {
      req.tenant = { churchId: tenant.id, language: tenant.language };
      // Set session variables for RLS policies
      await pool.query("SELECT set_config('app.church_id', $1, false)", [String(tenant.id)]);
      if (tenant.language) {
        await pool.query("SELECT set_config('app.language', $1, false)", [tenant.language]);
      }
    } else {
      // No matching tenant – treat as public/joint (id=0)
      req.tenant = { churchId: 0, language: null };
      await pool.query("SELECT set_config('app.church_id', '0', false)");
    }
    next();
  } catch (err) {
    console.error('[TenantResolver] error:', err.message);
    next();
  }
}

module.exports = tenantResolver;
