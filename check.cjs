const fs = require('fs');
const lines = fs.readFileSync('azure_ready_data.sql', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('INSERT INTO "public"."profiles"'));
console.log(lines.slice(idx, idx+10).join('\n'));
