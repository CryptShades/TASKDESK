-- Add composite indexes on task_events table for efficient querying
-- These indexes support common query patterns used throughout the application

-- Index for queries like: SELECT * FROM task_events WHERE task_id = $1 ORDER BY created_at DESC
-- Optimizes single-task event history lookups
CREATE INDEX IF NOT EXISTS idx_task_events_task_created ON task_events(task_id, created_at DESC);

-- Index for queries like: SELECT * FROM task_events WHERE org_id = $1 AND event_type = $2 ORDER BY created_at DESC
-- Optimizes org-level event filtering by type (e.g., fetching all escalation events for an org)
CREATE INDEX IF NOT EXISTS idx_task_events_org_type_created ON task_events(org_id, event_type, created_at DESC);
