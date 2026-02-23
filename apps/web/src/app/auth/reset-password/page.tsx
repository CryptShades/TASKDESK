'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const queryToken = searchParams.get('token') || searchParams.get('access_token');
    if (queryToken) {
      setToken(queryToken);
      return;
    }

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const hashToken = hashParams.get('access_token') || hashParams.get('token');
      if (hashToken) {
        setToken(hashToken);
      }
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError('Reset token is missing. Open the latest reset link from your email.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!PASSWORD_RULE.test(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and number.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, token }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unable to reset password.');
        return;
      }

      setSuccessMessage(
        data.message || 'Password reset successful. Please log in with your new password.'
      );
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Unable to reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">Set a new password</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Choose a strong password to secure your account.
        </p>
      </div>

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-md border border-primary/40 bg-primary/10 p-3"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="flex-1 text-sm text-foreground">{successMessage}</p>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss"
            className="shrink-0 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-risk-hard-border bg-risk-hard-bg p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-risk-hard" />
          <p className="flex-1 text-sm text-risk-hard">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="shrink-0 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-risk-hard rounded"
          >
            <X className="h-4 w-4 text-risk-hard" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="reset-password"
          label="New Password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters with uppercase, lowercase, and number."
          disabled={loading}
        />
        <Input
          id="reset-confirm-password"
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Update password
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted">
        Back to{' '}
        <Link
          href="/login"
          className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          login
        </Link>
      </p>
    </div>
  );
}
