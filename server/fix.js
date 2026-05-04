const fs = require('fs');

let content = fs.readFileSync('server/master_schema.sql', 'utf8');

// Fix 1: Remove CREATE POLICY ON FUNCTION
content = content.replace(/CREATE POLICY "Allow only safe SQL queries" ON FUNCTION public\.execute_sql[\s\S]*?USING \(public\.check_sql_query_safety\(query\)\);/g, '');

// Fix 2: Fix FOR SELECT, UPDATE
content = content.replace(/ON children FOR SELECT, UPDATE/g, 'ON children FOR ALL');

// Fix 3: Remove any BOM if present
content = content.replace(/^\uFEFF/, '');

fs.writeFileSync('server/master_schema.sql', content, 'utf8');
console.log('Fixed master_schema.sql');
