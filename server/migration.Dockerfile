FROM postgres:15-alpine

# Copy the cleaned data directly into the image
COPY azure_ready_data.sql /migration.sql

# Command to run the migration using environment variables for credentials
CMD ["sh", "-c", "PGPASSWORD=\"$DB_PASSWORD\" psql -h \"$DB_HOST\" -U \"$DB_USER\" -d kiddochecker -f /migration.sql"]
