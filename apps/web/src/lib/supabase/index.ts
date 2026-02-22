// Browser client (client components)
export { createClient as createBrowserClient } from './client';

// Server component client (server components, API routes)
export { createClient as createServerClient } from './server';

// Admin client (server-only, bypasses RLS)
export { createAdminClient } from './admin';