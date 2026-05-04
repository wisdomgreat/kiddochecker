const fs = require('fs');

const sql = fs.readFileSync('azure_ready_data.sql', 'utf8');
const tables = new Map();

// Parse INSERT statements: INSERT INTO "public"."table_name" ("col1", "col2") VALUES \n (val1, val2)
const regex = /INSERT INTO "public"\."([^"]+)" \(([^)]+)\) VALUES\s*\n\s*\((.*)\)[,;]/g;
let match;

function inferType(val) {
  val = val.trim();
  if (val === 'NULL') return 'TEXT'; // Fallback
  if (val === 'true' || val === 'false') return 'BOOLEAN';
  if (/^[0-9]+$/.test(val)) return 'INTEGER';
  if (/^[0-9]+\.[0-9]+$/.test(val)) return 'NUMERIC';
  
  if (val.startsWith("'")) {
    const unquoted = val.slice(1, -1);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(unquoted)) return 'UUID';
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(unquoted)) return 'TIMESTAMPTZ';
    if (/^\d{4}-\d{2}-\d{2}$/.test(unquoted)) return 'DATE';
    if (unquoted.startsWith('{') || unquoted.startsWith('[')) return 'TEXT'; // Prevent JSON parse errors
    return 'TEXT';
  }
  
  // if starts with '{' (some arrays are unquoted in SQL?) No, string literals are quoted
  return 'TEXT';
}

// Custom split function that respects quotes
function splitValues(str) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "'" && (i === 0 || str[i-1] !== '\\')) {
      inQuotes = !inQuotes;
      current += c;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

while ((match = regex.exec(sql)) !== null) {
  const tableName = match[1];
  if (!tables.has(tableName)) {
    const cols = match[2].split(',').map(c => c.trim().replace(/"/g, ''));
    const valsStr = match[3];
    const vals = splitValues(valsStr);
    
    const schemaMap = {};
    for (let i = 0; i < cols.length; i++) {
      schemaMap[cols[i]] = inferType(vals[i]);
    }
    tables.set(tableName, { cols, schemaMap });
  }
}

let out = `-- Generated Smart Base Schema\n\n`;
out += `DROP SCHEMA public CASCADE;\n`;
out += `CREATE SCHEMA public;\n\n`;

for (const [tableName, data] of tables.entries()) {
  out += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
  const colDefs = data.cols.map(c => {
    let type = data.schemaMap[c];
    if (c === 'id') return `  id UUID PRIMARY KEY DEFAULT gen_random_uuid()`;
    if (c === 'created_at' || c === 'updated_at') return `  ${c} TIMESTAMPTZ DEFAULT now()`;
    return `  ${c} ${type}`;
  });
  out += colDefs.join(',\n');
  out += `\n);\n\n`;
}

fs.writeFileSync('server/base_tables.sql', out, 'utf8');
console.log('Generated server/base_tables.sql with ' + tables.size + ' tables (smart types).');
