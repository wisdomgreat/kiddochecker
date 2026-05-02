import re

input_file = 'supabase_data_export.sql'
output_file = 'azure_ready_data.sql'

print(f"Cleaning {input_file}...")

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(output_file, 'w', encoding='utf-8') as f:
    # Disable triggers/constraints for the import session
    f.write("SET session_replication_role = 'replica';\n\n")
    
    skip_mode = False
    for line in lines:
        # Detect start of non-public schema inserts
        if 'INSERT INTO "auth"' in line or 'INSERT INTO "storage"' in line:
            skip_mode = True
            continue
        
        # Simple detection for end of an insert statement (very naive but usually works for pg_dump)
        if skip_mode:
            if line.strip().endswith(';'):
                skip_mode = False
            continue
            
        f.write(line)
        
    f.write("\n\nSET session_replication_role = 'origin';\n")

print(f"Done! Cleaned data saved to {output_file}")
