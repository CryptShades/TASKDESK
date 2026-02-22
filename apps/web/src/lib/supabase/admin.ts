import { createClient } from '@supabase/supabase-js';

/**
 * ⛔ SERVER-SIDE ONLY. NEVER IMPORT IN CLIENT COMPONENTS.
 * Uses SUPABASE_SERVICE_ROLE_KEY which must not be exposed to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
