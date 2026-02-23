# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **TypeScript Compilation**: Fixed incomplete task objects in test files to include all required Task interface properties (campaign_id, org_id, title, owner_id, due_date, dependency_id, assigned_at, created_at, updated_at)
- **Test Suite**: Updated Supabase mocks in worker integration tests to support proper chaining and added missing methods (delete, lt) for risk-engine and reminder-engine tests
- **Build Process**: Added `export const dynamic = 'force-dynamic'` to escalations and tasks pages to prevent static generation failures with cookie-dependent server components
- **Schema Compliance**: Verified task_events table columns match service expectations: id, task_id, org_id, actor_id, event_type, old_value, new_value, created_at
- **Data Integrity**: Ensured all task_events INSERT operations include actor_id field (manual task creation, status updates, risk engine events, escalation events, reminder events)
- **Security**: Implemented CRON_SECRET environment variable validation with null checks in cron-auth.ts and applied to all cron endpoints (risk-engine, reminders)
- **Field References**: Removed all references to non-existent 'risk_level' column, corrected to use 'risk_flag' throughout codebase
- **Database Operations**: Updated notification creation to use admin client (createAdminClient) for INSERT operations to comply with RLS policies

### Security
- Enhanced cron endpoint authentication with proper CRON_SECRET validation
- Ensured notification inserts use service role permissions

### Testing
- Fixed test mocks for Supabase client chaining in worker integration tests
- Updated test data structures to match complete TypeScript interfaces

### Build
- Resolved Next.js static generation issues for dynamic pages