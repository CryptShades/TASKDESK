# Supabase Production Checklist

Ensure the following security and infrastructure checks are completed before going live.

## 🔒 Security & RLS

- [ ] **RLS Enabled**: Verify row-level security is active on all 7 tables.
  - SQL: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- [ ] **Restricted Permissions**: `task_events` table must not allow UPDATE or DELETE for non-service-role users.
- [ ] **Service Role Lock**: Ensure the `SERVICE_ROLE_KEY` is only used in server-side crons and never leaked to the client.
- [ ] **Auth Signups**: Email confirmation should be enabled for production (or handled via invitation flow).

## 🚀 Performance & Realtime

- [ ] **Indexing**: Verify indexes on frequently queried columns:
  - `tasks(org_id, status)`
  - `tasks(owner_id)`
  - `campaigns(org_id)`
  - `notifications(user_id, read)`
- [ ] **Realtime Channels**: Ensure Realtime is enabled in the Supabase Dashboard for:
  - `campaigns`
  - `tasks`
  - `notifications`
- [ ] **Database Webhooks**: Verify that webhooks for push notifications are correctly pointing to the production edge functions/API.

## 🛠️ Keys & Environment

- [ ] **Anon Key**: Only used in client-side code; restricted by RLS.
- [ ] **Database Backups**: Enable PitR (Point-in-Time Recovery) in the Supabase dashboard.
- [ ] **Connection Pooling**: Use the Transaction pooler (port 6543) for serverless environment (Vercel).
