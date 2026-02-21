import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for use in Client Components.
 * Call once per component render — SSR/RSC should use `createClient` from server.ts instead.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
