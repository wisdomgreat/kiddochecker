const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// ─── Database Connection ───────────────────────────────────────────────────
// These environment variables will be injected by Azure Container Apps
const pool = new Pool({
  host: process.env.DB_HOST || '10.0.1.4',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'kiddochecker_admin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'kiddochecker',
  ssl: { rejectUnauthorized: false } // Required for Azure PostgreSQL
});

app.use(cors());
app.use(express.json());

// ─── Azure Entra JWT Verification ──────────────────────────────────────────
const client = jwksClient({
  jwksUri: `https://kiddochecker.ciamlogin.com/08e0221b-0776-4500-8e5f-c6002cf868bc/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send('Access Denied: No Token Provided');

  const token = authHeader.split(' ')[1];
  jwt.verify(token, getKey, {
    audience: 'e48264b2-de12-4444-a290-a8d7f3e3a525',
    issuer: `https://login.microsoftonline.com/08e0221b-0776-4500-8e5f-c6002cf868bc/v2.0`
  }, (err, decoded) => {
    if (err) return res.status(403).send('Invalid Token');
    req.user = decoded; // This includes the OID (sub claim)
    next();
  });
};

// ─── API Routes ────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => res.send('Bridge is active! 🌉'));

// Secure route to fetch user profile, roles, and permissions
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const azureId = req.user.sub; // Azure OID
    console.log(`[Bridge] Fetching profile for OID: ${azureId}`);
    
    // Fetch profile and role in one go
    const userQuery = `
      SELECT p.*, r.role, r.is_super_admin, r.verification_status 
      FROM public.profiles p
      LEFT JOIN public.user_roles r ON p.id = r.user_id
      WHERE p.id = $1
    `;
    
    const userResult = await pool.query(userQuery, [azureId]);
    if (userResult.rows.length === 0) {
      console.warn(`[Bridge] Profile not found for OID: ${azureId}`);
      return res.status(404).json({ error: 'Profile not found' });
    }

    const userData = userResult.rows[0];

    // Fetch permissions
    const permsQuery = `
      SELECT DISTINCT name FROM (
        SELECT p.name 
        FROM public.permissions p
        JOIN public.role_permissions rp ON p.id = rp.permission_id
        JOIN public.user_roles ur ON rp.role_id = ur.custom_role_id
        WHERE ur.user_id = $1
        UNION
        SELECT p.name 
        FROM public.permissions p
        JOIN public.group_permissions gp ON p.id = gp.permission_id
        JOIN public.user_security_groups usg ON gp.group_id = usg.group_id
        WHERE usg.user_id = $1
      ) combined_perms
    `;
    
    const permsResult = await pool.query(permsQuery, [azureId]);
    const permissions = permsResult.rows.map(r => r.name);

    res.json({
      ...userData,
      permissions
    });
  } catch (err) {
    console.error('[Bridge] Profile fetch failed:', err);
    res.status(500).json({ error: 'Data retrieval failed', details: err.message });
  }
});

/**
 * Generic RPC Proxy
 * Mimics supabase.rpc(fn, params)
 */
app.post('/api/rpc', verifyToken, async (req, res) => {
  const { fn, params } = req.body;
  if (!fn) return res.status(400).json({ error: 'Missing function name' });

  console.log(`[Bridge] RPC Call: ${fn}`, params);

  try {
    const keys = Object.keys(params || {});
    const values = Object.values(params || {});
    
    // Construct named parameters: select * from fn_name(p1 => $1, p2 => $2)
    const placeholders = keys.map((key, i) => `${key} => $${i + 1}`).join(', ');
    const query = `SELECT * FROM ${fn}(${placeholders})`;
    
    const result = await pool.query(query, values);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error(`[Bridge] RPC Error (${fn}):`, err);
    res.status(500).json({ data: null, error: err.message });
  }
});

/**
 * Generic Table Query Proxy (Simplified Select)
 * Mimics supabase.from(table).select().eq(...)
 */
app.post('/api/query', verifyToken, async (req, res) => {
  const { table, select = '*', filters = [] } = req.body;
  if (!table) return res.status(400).json({ error: 'Missing table name' });

  try {
    let query = `SELECT ${select} FROM ${table}`;
    const values = [];
    
    if (filters && filters.length > 0) {
      const filterClauses = filters.map((f, i) => {
        values.push(f.value);
        return `${f.column} ${f.operator || '='} $${i + 1}`;
      });
      query += ` WHERE ${filterClauses.join(' AND ')}`;
    }

    const result = await pool.query(query, values);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error(`[Bridge] Query Error (${table}):`, err);
    res.status(500).json({ data: null, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 KiddoChecker Bridge operational at port ${port}`);
  console.log(`🔗 Target Database: ${pool.options.host}`);
});
