const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// ─── Database Connection ───────────────────────────────────────────────────
// These environment variables will be injected by Azure Container Apps
const pool = new Pool({
  host: process.env.DB_HOST || '10.0.1.4',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'kiddomin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'kiddochecker',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

// Self-healing: Ensure schema and table exist
async function setupDatabase() {
  console.log('[DB] Attempting to verify schema...');
  try {
    await pool.query(`
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.verification_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes')
      );
    `);
    console.log('[DB] Auth schema and table verified.');
  } catch (err) {
    console.error('[DB] Schema Setup Error (Non-Fatal):', err.message);
  }
}

// Initialize DB in background
setupDatabase();

app.use(cors({
  origin: '*',
  methods: '*',
  allowedHeaders: '*'
}));
app.use(express.json());
app.use((req, res, next) => {
  res.setTimeout(15000, () => {
    console.warn(`[Bridge] Request timed out: ${req.method} ${req.url}`);
    res.status(408).send('Request Timeout');
  });
  next();
});

// ─── Email & SMS Helpers (Ported from Edge Functions) ────────────────────────
async function sendEmail({ to, subject, html }) {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    console.log(`[AUTH] Calling Resend API for: ${to}`);
    const data = await resend.emails.send({
      from: 'KiddoChecker <noreply@kiddochecker.com>',
      to: [to],
      subject: subject,
      html: html,
    });
    clearTimeout(timeoutId);
    return { success: true, data };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[Bridge] Email Error:', err.message);
    if (err.name === 'AbortError') return { success: false, error: 'Email service timed out' };
    return { success: false, error: err.message };
  }
}

// ─── Auto-Migration Logic ───────────────────────────────────────────────────
async function runMigrations() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log('[Bridge] Checking for database migrations...');
    
    // Check if profiles table exists and has data
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    let needsBootstrap = !tableExists;

    if (tableExists) {
      const dataCheck = await pool.query('SELECT COUNT(*) FROM public.profiles');
      if (parseInt(dataCheck.rows[0].count) === 0) {
        needsBootstrap = true;
      }
    }

    if (needsBootstrap) {
      console.log('[Bridge] 🚀 Bootstrapping empty database with production data...');
      const sqlPath = path.join(__dirname, 'azure_ready_data.sql');
      if (fs.existsSync(sqlPath)) {
        const bootstrapSql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(bootstrapSql);
        console.log('[Bridge] ✅ Database bootstrap completed successfully.');
      } else {
        console.warn('[Bridge] ⚠️ azure_ready_data.sql not found, skipping bootstrap.');
      }
    }
  } catch (err) {
    console.error('[Bridge] Migration error (this may be normal if already applied):', err.message);
  }

  try {
    const patch = `
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS azure_oid TEXT;
      CREATE INDEX IF NOT EXISTS idx_profiles_azure_oid ON public.profiles(azure_oid);
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS auth.verification_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '10 minutes'),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    await pool.query(patch);
    console.log('[Bridge] Database migrations applied successfully! ✅');
  } catch (err) {
    console.error('[Bridge] Migration error (this may be normal if already applied):', err.message);
  }
}

// ─── Azure Entra JWT Verification ──────────────────────────────────────────
function getKey(header, callback) {
  const jwksClient = require('jwks-rsa');
  const client = jwksClient({
    jwksUri: `https://kiddochecker.ciamlogin.com/08e0221b-0776-4500-8e5f-c6002cf868bc/discovery/v2.0/keys`
  });
  
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send('Access Denied: No Token Provided');

  const token = authHeader.split(' ')[1];
  
  // 1. Try Bridge Native Token first (Faster)
  try {
    const decoded = jwt.verify(token, BRIDGE_SECRET);
    req.user = decoded;
    return next();
  } catch (bridgeErr) {
    // 2. Fallback to Azure Token verification
    jwt.verify(token, getKey, {
      audience: 'e48264b2-de12-4444-a290-a8d7f3e3a525',
      issuer: `https://kiddochecker.ciamlogin.com/08e0221b-0776-4500-8e5f-c6002cf868bc/v2.0`
    }, (err, decoded) => {
      if (err) {
        console.error('[Bridge] Token invalid for both Bridge and Azure');
        return res.status(403).send('Invalid Token');
      }
      req.user = decoded;
      next();
    });
  }
};

// ─── API Routes ────────────────────────────────────────────────────────────

const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'kiddochecker-super-secret-2026';

// Health check
app.get('/health', (req, res) => res.send('Bridge is active! 🌉'));
app.get('/', (req, res) => res.send('KiddoChecker Bridge API is online. 🚀'));

/**
 * NATIVE AUTH: Send branded OTP via Resend
 */
app.post('/api/auth/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  console.log(`[AUTH] Generating code for: ${email}`);
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  
  try {
    console.log(`[AUTH] Saving code to DB...`);
    // 1. Save code to DB
    await pool.query(
      'INSERT INTO auth.verification_codes (email, code) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET code = $2, created_at = NOW()',
      [email, code]
    );

    // 2. Send Branded Email
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px;">
        <h2 style="color: #6366f1;">Your KiddoChecker Code</h2>
        <p style="font-size: 16px; color: #475569;">Enter this code to access your dashboard. It expires in 10 minutes.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #94a3b8;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    console.log(`[AUTH] Sending email via Resend...`);
    await sendEmail({ to: email, subject: `${code} is your KiddoChecker code`, html });
    
    console.log(`[AUTH] Success! Code sent to ${email}`);
    res.json({ success: true, message: 'Code sent!' });
  } catch (err) {
    console.error('[AUTH] ERROR in send-code:', err);
    res.status(500).json({ error: 'Failed to send verification code', details: err.message });
  }
});

/**
 * NATIVE AUTH: Verify code and issue JWT
 */
app.post('/api/auth/verify-code', async (req, res) => {
  const { email, code } = req.body;
  
  try {
    // 1. Check code
    const result = await pool.query(
      'SELECT * FROM auth.verification_codes WHERE email = $1 AND code = $2 AND expires_at > now() ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    // 2. Clean up codes for this email
    await pool.query('DELETE FROM auth.verification_codes WHERE email = $1', [email]);

    // 3. Provision / Link User
    let profileQuery = 'SELECT * FROM public.profiles WHERE email = $1 LIMIT 1';
    let profileResult = await pool.query(profileQuery, [email]);
    let userData;

    if (profileResult.rows.length === 0) {
      const { rows } = await pool.query(
        'INSERT INTO public.profiles (email, role) VALUES ($1, $2) RETURNING *',
        [email, 'parent']
      );
      userData = rows[0];
    } else {
      userData = profileResult.rows[0];
    }

    // 4. Issue Bridge JWT (This bypasses Azure MSAL for the session)
    const token = jwt.sign(
      { sub: userData.id, email: userData.email, role: userData.role, name: userData.full_name },
      BRIDGE_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, profile: userData });
  } catch (err) {
    console.error('[Bridge] Verification Error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Secure route to fetch user profile, roles, and permissions
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const azureId = req.user.sub; // Azure OID
    const userEmail = req.user.email || req.user.preferred_username;
    
    console.log(`[Bridge] Fetching profile. OID: ${azureId}, Email: ${userEmail}`);
    
    // 1. Try to find user by Azure OID first, fallback to Email
    let lookupQuery = `
      SELECT p.*, r.role, r.is_super_admin, r.verification_status 
      FROM public.profiles p
      LEFT JOIN public.user_roles r ON p.id = r.user_id
      WHERE p.azure_oid = $1 OR p.email = $2
      LIMIT 1
    `;
    
    let userResult = await pool.query(lookupQuery, [azureId, userEmail]);
    let userData;

    if (userResult.rows.length === 0) {
      // 2. NEW USER: Auto-create profile for brand new signups
      console.log(`[Bridge] New user detected. Creating profile for: ${userEmail}`);
      const createQuery = `
        INSERT INTO public.profiles (email, azure_oid, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, 'parent')
        RETURNING *
      `;
      const [firstName, lastName] = (req.user.name || 'New User').split(' ');
      const createResult = await pool.query(createQuery, [userEmail, azureId, firstName, lastName || '']);
      userData = createResult.rows[0];
    } else {
      userData = userResult.rows[0];
      // 3. AUTO-LINK: Update azure_oid if it's missing (Migrated user)
      if (userData.azure_oid !== azureId) {
        console.log(`[Bridge] Linking Azure OID ${azureId} to profile ${userData.id}`);
        await pool.query('UPDATE public.profiles SET azure_oid = $1 WHERE id = $2', [azureId, userData.id]);
      }
    }

    const internalId = userData.id;

    // ─── Role Enforcement ──────────────────────────────────────────────────
    // Only allow 'parent' role to access the frontend (as per original app)
    if (userData.role !== 'parent' && userData.role !== 'admin' && userData.role !== 'staff') {
      console.warn(`[Bridge] Access denied for role: ${userData.role}`);
      return res.status(403).json({ 
        error: 'Access Restricted', 
        message: 'This portal is for Parents only. Please use the Staff or Admin portal.' 
      });
    }

    // 4. Role-Based MFA Logic
    const mfaRequiredRoles = ['admin', 'staff', 'teacher', 'volunteer'];
    const requiresMfa = mfaRequiredRoles.includes((userData.role || '').toLowerCase()) || userData.is_super_admin;

    // 5. Fetch permissions using the internal UUID
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
    
    const permsResult = await pool.query(permsQuery, [internalId]);
    const permissions = permsResult.rows.map(r => r.name);

    res.json({
      ...userData,
      azure_oid: azureId,
      requires_mfa: requiresMfa,
      permissions
    });
  } catch (err) {
    console.error('[Bridge] Profile fetch failed:', err);
    res.status(500).json({ error: 'Data retrieval failed', details: err.message });
  }
});

/**
 * Email Proxy (Ported from Supabase Edge Function)
 * Allows the frontend to send emails through Resend via the Bridge
 */
app.post('/api/send-email', verifyToken, async (req, res) => {
  const { to, subject, html, message } = req.body;
  
  // Use either the provided HTML or wrap the message in a basic template
  const finalHtml = html || `<div style="font-family: sans-serif; padding: 20px;">${message}</div>`;
  
  const result = await sendEmail({ to, subject, html: finalHtml });
  if (result.success) {
    res.json({ data: result.data, error: null });
  } else {
    res.status(500).json({ data: null, error: result.error });
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

/**
 * Generic Mutation Proxy (Insert, Update, Delete)
 */
app.post('/api/mutate', verifyToken, async (req, res) => {
  const { table, action, data, filters = [] } = req.body;
  if (!table || !action) return res.status(400).json({ error: 'Missing table or action' });

  try {
    let query = '';
    let values = [];

    if (action === 'insert') {
      const keys = Object.keys(data);
      values = Object.values(data);
      const columns = keys.join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    } 
    else if (action === 'update') {
      const keys = Object.keys(data);
      values = Object.values(data);
      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      query = `UPDATE ${table} SET ${setClause}`;
      
      if (filters.length > 0) {
        const filterStartIdx = values.length;
        const filterClauses = filters.map((f, i) => {
          values.push(f.value);
          return `${f.column} ${f.operator || '='} $${filterStartIdx + i + 1}`;
        });
        query += ` WHERE ${filterClauses.join(' AND ')}`;
      }
      query += ` RETURNING *`;
    }
    else if (action === 'delete') {
      query = `DELETE FROM ${table}`;
      if (filters.length > 0) {
        const filterClauses = filters.map((f, i) => {
          values.push(f.value);
          return `${f.column} ${f.operator || '='} $${i + 1}`;
        });
        query += ` WHERE ${filterClauses.join(' AND ')}`;
      }
      query += ` RETURNING *`;
    }

    const result = await pool.query(query, values);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error(`[Bridge] Mutation Error (${action} on ${table}):`, err);
    res.status(500).json({ data: null, error: err.message });
  }
});

// Start listening immediately to pass Azure health probes
app.listen(port, () => {
  console.log(`🚀 KiddoChecker Bridge operational at port ${port}`);
  console.log(`🔗 Target Database: ${pool.options.host}`);
  
  // Run migrations in the background
  runMigrations().then(() => {
    console.log('[DB] Background migrations completed.');
  }).catch(err => {
    console.error('[DB] Background migrations failed:', err.message);
  });
});
