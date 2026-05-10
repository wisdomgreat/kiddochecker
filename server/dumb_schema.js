const fs = require('fs');

const sql = fs.readFileSync('azure_ready_data.sql', 'utf8');

const tables = new Map();

// Parse INSERT statements: INSERT INTO "public"."table_name" ("col1", "col2") VALUES
const regex = /INSERT INTO "public"\."([^"]+)" \(([^)]+)\) VALUES/g;
let match;
while ((match = regex.exec(sql)) !== null) {
  const tableName = match[1];
  if (!tables.has(tableName)) {
    const colsStr = match[2];
    const cols = colsStr.split(',').map(c => c.trim().replace(/"/g, ''));
    tables.set(tableName, cols);
  }
}

let out = `-- Generated Dumb Base Schema\n\n`;
out += `DROP SCHEMA public CASCADE;\n`;
out += `CREATE SCHEMA public;\n\n`;

for (const [tableName, cols] of tables.entries()) {
  out += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
  const colDefs = cols.map(c => {
    if (c === 'id') return `  id UUID PRIMARY KEY DEFAULT gen_random_uuid()`;
    return `  ${c} TEXT`;
  });
  out += colDefs.join(',\n');
  out += `\n);\n\n`;
}

fs.writeFileSync('server/base_tables.sql', out, 'utf8');
console.log('Generated server/base_tables.sql with ' + tables.size + ' tables (TEXT fallback).');
