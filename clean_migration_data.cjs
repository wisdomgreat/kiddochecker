const fs = require('fs');

const inputFile = 'supabase_data_export.sql';
const outputFile = 'azure_ready_data.sql';

console.log(`Cleaning ${inputFile}...`);

const data = fs.readFileSync(inputFile, 'utf8');
const lines = data.split('\n');

const output = [];
output.push("SET session_replication_role = 'replica';\n");

let skipMode = false;
for (const line of lines) {
    if (line.includes('INSERT INTO "auth"') || line.includes('INSERT INTO "storage"')) {
        skipMode = true;
        continue;
    }

    if (skipMode) {
        if (line.trim().endsWith(';')) {
            skipMode = false;
        }
        continue;
    }

    output.push(line);
}

output.push("\nSET session_replication_role = 'origin';\n");

fs.writeFileSync(outputFile, output.join('\n'));
console.log(`Done! Cleaned data saved to ${outputFile}`);
