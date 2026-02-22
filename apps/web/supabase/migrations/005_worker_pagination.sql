-- Add cursor tracking columns to worker_locks table for pagination support.
-- Enables background workers to process large datasets in batches without
-- exceeding Vercel's 60-second function timeout.

ALTER TABLE worker_locks
ADD COLUMN IF NOT EXISTS last_processed_org_id uuid,
ADD COLUMN IF NOT EXISTS page_size integer DEFAULT 10;

-- last_processed_org_id: cursor for org pagination. NULL means start from beginning.
-- page_size: number of orgs to process per invocation. Default 10 is safe for
--           most deployments. Can be adjusted based on task volume and performance.
