-- Worker distributed lock table.
-- Prevents concurrent execution of cron workers when multiple Vercel
-- invocations overlap (e.g., slow run from previous hour still in flight).
-- Locks are acquired with INSERT ... ON CONFLICT DO NOTHING.
-- Expired locks (expires_at < NOW()) are treated as available for acquisition.

CREATE TABLE IF NOT EXISTS worker_locks (
  id          text        PRIMARY KEY,
  locked_at   timestamptz NOT NULL DEFAULT NOW(),
  expires_at  timestamptz NOT NULL
);

-- Service-role only: workers run with the service-role key via the cron routes.
-- No public read/write needed.
ALTER TABLE worker_locks ENABLE ROW LEVEL SECURITY;

-- No RLS policies — all access is via the service role which bypasses RLS.
-- Regular authenticated users cannot read or write this table.
