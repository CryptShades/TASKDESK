-- Check what already exists in the database
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check for existing types
SELECT 
  n.nspname as schema_name,
  t.typname as type_name,
  t.typtype as type_type
FROM pg_type t
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typtype = 'e'
ORDER BY t.typname;
