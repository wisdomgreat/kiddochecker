const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Try loading local environment from workspace root
const rootEnvPath = path.join(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  require('dotenv').config();
}

const app = express();
app.use(express.json());

const PORT = 4000;

// Setup database connection pooling
// Uses variables from workspace .env or defaults
const dbConfig = {
  host: process.env.DB_HOST || 'psql-kiddo-prod-yotzp.postgres.database.azure.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'kiddomin',
  password: process.env.DB_PASSWORD || 'Kiddochecker@123!',
  database: process.env.DB_NAME || 'kiddochecker',
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
};

console.log('[Local Console] Attempting database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  ssl: !!dbConfig.ssl
});

let pool;
try {
  pool = new Pool(dbConfig);
} catch (e) {
  console.error('[Local Console] Pool creation failed:', e.message);
}

// Check database connection status
app.get('/api/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as db, version() as ver');
    res.json({
      connected: true,
      time: result.rows[0].time,
      database: result.rows[0].db,
      version: result.rows[0].ver,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database,
      }
    });
  } catch (err) {
    res.json({
      connected: false,
      error: err.message,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database,
      }
    });
  }
});

// Run raw SQL queries securely on local request
app.post('/api/query', async (req, res) => {
  const { sql, params } = req.body;
  if (!sql) {
    return res.status(400).json({ error: 'No SQL query provided' });
  }

  console.log('[Local Console] Executing:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
  try {
    const client = await pool.connect();
    try {
      // Temporarily switch off RLS in session to allow admin operations locally
      await client.query('SET row_security = off').catch(() => {});
      const result = await client.query(sql, params);
      res.json({
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields ? result.fields.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })) : []
      });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all user tables in public schema
app.get('/api/tables', async (req, res) => {
  const sql = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  try {
    const result = await pool.query(sql);
    res.json({ tables: result.rows.map(r => r.table_name) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the console
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 KIDDOCHECKER LOCAL DB CONSOLE RUNNING`);
  console.log(`👉 Access URL: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
