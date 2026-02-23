#!/bin/bash

# Taskdesk Database Setup Script
# Run this after setting up your Supabase project

echo "🚀 Setting up Taskdesk database..."
echo "Make sure you're connected to your Supabase project"
echo ""

MIGRATIONS_DIR="./supabase/migrations"

# Array of migration files in order
MIGRATIONS=(
    "001_initial_schema.sql"
    "002_invitations.sql"
    "003_worker_locks.sql"
    "004_task_events_index.sql"
    "005_worker_pagination.sql"
    "006_invite_security.sql"
)

echo "📋 Migration files to apply:"
for migration in "${MIGRATIONS[@]}"; do
    echo "  - $migration"
done

echo ""
echo "🔧 To apply these migrations:"
echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to SQL Editor"
echo "4. Copy and paste each migration file content in order"
echo "5. Execute each one"
echo ""
echo "Or use Supabase CLI if installed:"
echo "  supabase db push"
echo ""
echo "After applying migrations, run the seed data:"
echo "  supabase db reset  # This will apply migrations + seed"
echo ""
echo "⚠️  WARNING: This will reset your database!"
echo "Make sure you have backups if this is a production database."