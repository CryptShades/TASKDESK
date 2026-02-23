# Security Model

This document describes the security controls in Taskdesk and how to operate them safely.

---

## Row-Level Security (RLS)

All application tables have RLS enabled in Supabase. The core enforcement functions are:

| Function | Returns |
|---|---|
| `public.get_user_org_id(uid)` | The `org_id` for the authenticated user |
| `public.get_user_role(uid)` | The `user_role` enum value for the authenticated user |

**Policies in effect:**

- `users`, `campaigns`, `tasks`, `escalations`, `task_events` — authenticated users can only read/write rows belonging to their own `org_id`.
- `invitations` — only `founder` and `manager` roles can insert or delete invitation rows for their org.
- Workers and health checks use the **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) via `createAdminClient()`, which bypasses RLS. This client must never be instantiated in browser-accessible code.

---

## Rate Limiting

Auth endpoints are rate-limited at the Edge (Next.js Middleware) using [Upstash Redis](https://upstash.com).

| Endpoint | Limit | Window | Key |
|---|---|---|---|
| `POST /api/auth/signup` | 5 requests | 15 minutes | per IP |
| `POST /api/auth/invite/accept` | 10 requests | 15 minutes | per IP |

**Response headers on all requests to limited routes:**

```
X-RateLimit-Limit:     <max requests in window>
X-RateLimit-Remaining: <requests left>
X-RateLimit-Reset:     <Unix ms timestamp when window resets>
```

**On limit exceeded — HTTP 429:**

```json
{ "error": "Too many requests. Please try again later." }
```

With header `Retry-After: <seconds until reset>`.

**Graceful degradation:** If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` are absent, rate limiting is silently skipped. All requests pass through. This allows local development without an Upstash account.

**Configuration:** Set the following environment variables (see `.env.example`):

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Create a Redis database at <https://console.upstash.com>. Use the **REST API** credentials, not the Redis connection string.

---

## Cron Job Authentication

Background workers (`/api/cron/risk-engine`, `/api/cron/reminders`) are protected by a shared secret.

Every cron request must include the header:

```
Authorization: Bearer <CRON_SECRET>
```

Set `CRON_SECRET` to a cryptographically random string (e.g. `openssl rand -hex 32`). The value in your Vercel Cron configuration must match the env var exactly.

Requests without a valid `Authorization` header receive **HTTP 401**.

---

## Service Role Key

`SUPABASE_SERVICE_ROLE_KEY` grants full database access bypassing RLS. Usage is restricted to:

- `createAdminClient()` in `lib/supabase/admin.ts`
- Server-side only: workers, health check, `acceptInvite`, `signUp`

**Never expose this key to the browser.** It is not prefixed with `NEXT_PUBLIC_` and will not be included in client bundles by Next.js.

---

## Invite Token Lifecycle

Invitation tokens go through the following states:

```
created → [pending] → accepted
                    ↘ expired (72h)
                    ↘ revoked (manual or auto after 3 failed attempts)
```

**Creation:**
- `POST /api/auth/invite` generates a Supabase Auth OTP token via `admin.generateLink`.
- The `hashed_token` is stored in `invitations.token_hash` for pre-flight lookups.
- `expires_at` defaults to **72 hours** from creation.

**Acceptance (`POST /api/auth/invite/accept`):**
1. Pre-flight DB lookup by `token_hash`.
2. If `revoked_at IS NOT NULL` → **403 INVITE_REVOKED**
3. If `accepted_at IS NOT NULL` → **403 INVITE_ALREADY_USED**
4. If `expires_at < now()` → **403 INVITE_EXPIRED**
5. Calls Supabase `verifyOtp`.
6. On `verifyOtp` failure → increments `attempt_count`. If `attempt_count >= 3`, sets `revoked_at = now()` (auto-revoke).
7. On success → sets `accepted_at = now()` to prevent token replay.

**Manual revocation:** Founders and managers can call `DELETE /api/auth/invite/:id`, which hard-deletes the row. Soft revocation (setting `revoked_at`) is used only for auto-revocation after failed attempts.

---

## Known v1 Limitations

- **No email verification on signup.** New accounts are auto-confirmed via `admin.updateUserById({ email_confirm: true })`. This is intentional for the current development phase but should be revisited before public launch.
- **Rate limiting is IP-based only.** Shared NAT environments (corporate offices) may hit limits for legitimate users. Per-account limiting (after authentication) is not implemented in v1.
- **No CAPTCHA on signup.** Bot-driven account creation is mitigated only by rate limiting.
- **Cron endpoints are not IP-restricted.** The `CRON_SECRET` bearer token is the only auth layer; network-level allowlisting is not enforced.
- **Invite token_hash may be null** for invitations created before migration `006`. Pre-flight checks are skipped (`if (invite)` guard) so older invites continue to work via `verifyOtp` alone.

---

## Vulnerability Reporting

Report security issues privately. Do not open public GitHub issues for vulnerabilities.

Contact: [security@taskdesk.io](mailto:security@taskdesk.io)

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We aim to acknowledge reports within 2 business days and resolve critical issues within 7 days.
