import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Attempts to acquire a distributed worker lock.
 *
 * Uses INSERT ... ON CONFLICT DO NOTHING so only one invocation wins the race.
 * Before inserting, expired locks are deleted so a crashed worker does not
 * permanently block future runs.
 *
 * @param supabase  Service-role Supabase client
 * @param lockName  Unique name for the lock (e.g. 'risk_engine')
 * @param ttlMinutes  Lock TTL — set slightly shorter than the cron interval so
 *                    a worker that crashes does not block the next scheduled run
 * @returns true if the lock was acquired, false if another instance holds it
 */
export async function acquireLock(
  supabase: SupabaseClient,
  lockName: string,
  ttlMinutes: number,
): Promise<boolean> {
  // Purge expired locks first so stale entries never block indefinitely.
  await supabase
    .from('worker_locks')
    .delete()
    .lt('expires_at', new Date().toISOString());

  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  const { error } = await supabase.from('worker_locks').insert({
    id: lockName,
    expires_at: expiresAt,
  });

  // Postgres unique-violation code is '23505'. Any other error is unexpected.
  if (error) {
    if (error.code === '23505') {
      // Another instance already holds the lock.
      return false;
    }
    // Surface unexpected errors so they appear in logs but don't crash the caller.
    console.error(
      JSON.stringify({ event: 'worker_lock_acquire_error', lockName, error }),
    );
    return false;
  }

  return true;
}

/**
 * Releases a previously acquired worker lock.
 * Safe to call even if the lock was never acquired (no-op in that case).
 */
export async function releaseLock(
  supabase: SupabaseClient,
  lockName: string,
): Promise<void> {
  const { error } = await supabase
    .from('worker_locks')
    .delete()
    .eq('id', lockName);

  if (error) {
    console.error(
      JSON.stringify({ event: 'worker_lock_release_error', lockName, error }),
    );
  }
}

/**
 * Reads cursor state for pagination-enabled workers.
 * Returns the last processed org ID (cursor) and page size for batch processing.
 *
 * @param supabase Service-role Supabase client
 * @param lockName Unique name for the lock (e.g., 'risk_engine', 'reminders')
 * @returns Object with lastProcessedOrgId (null = start from beginning) and pageSize
 */
export async function readCursorState(
  supabase: SupabaseClient,
  lockName: string,
): Promise<{ lastProcessedOrgId: string | null; pageSize: number }> {
  const { data, error } = await supabase
    .from('worker_locks')
    .select('last_processed_org_id, page_size')
    .eq('id', lockName)
    .single();

  if (error || !data) {
    console.error(
      JSON.stringify({ event: 'worker_lock_read_cursor_error', lockName, error }),
    );
    return { lastProcessedOrgId: null, pageSize: 10 };
  }

  return {
    lastProcessedOrgId: data.last_processed_org_id,
    pageSize: data.page_size || 10,
  };
}

/**
 * Updates cursor state after processing a batch of orgs.
 * Stores the ID of the last org processed so next invocation can continue from there.
 *
 * @param supabase Service-role Supabase client
 * @param lockName Unique name for the lock
 * @param lastProcessedOrgId UUID of the last org processed, or null to wrap around
 */
export async function updateCursorState(
  supabase: SupabaseClient,
  lockName: string,
  lastProcessedOrgId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('worker_locks')
    .update({ last_processed_org_id: lastProcessedOrgId })
    .eq('id', lockName);

  if (error) {
    console.error(
      JSON.stringify({
        event: 'worker_lock_update_cursor_error',
        lockName,
        error,
      }),
    );
  }
}

