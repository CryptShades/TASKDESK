'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unable to send password reset link.');
        return;
      }

      setMessage(
        data.message ||
          'If an account exists with this email, a password reset link has been sent.'
      );
    } catch {
      setError('Unable to send password reset link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">Reset your password</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Enter your email to receive a secure reset link.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-md border border-primary/40 bg-primary/10 p-3"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="flex-1 text-sm text-foreground">{message}</p>
          <button
            type="button"
            onClick={() => setMessage(null)}
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
          id="forgot-email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted">
        Remembered it?{' '}
        <Link
          href="/login"
          className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
