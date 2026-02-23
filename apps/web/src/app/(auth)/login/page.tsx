'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

interface FieldErrors {
  email?: string;
  password?: string;
}

interface AlertInfo {
  type: 'invalid_credentials' | 'unconfirmed' | 'generic';
  message: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertInfo | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          setAlert({
            type: 'invalid_credentials',
            message: 'Invalid email or password. Check your credentials and try again.',
          });
        } else if (msg.includes('database error querying schema')) {
          setAlert({
            type: 'generic',
            message: 'Database schema is incomplete. Run COMPLETE_SETUP.sql in Supabase SQL Editor, then try again.',
          });
        } else if (msg.includes('email not confirmed')) {
          setAlert({
            type: 'unconfirmed',
            message: "Your email address hasn't been confirmed yet. Check your inbox for a confirmation link.",
          });
        } else {
          setAlert({ type: 'generic', message: error.message });
        }
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email.trim()) return;
    const supabase = createClient();
    await supabase.auth.resend({ type: 'signup', email: email.trim() });
    setAlert({ type: 'generic', message: 'Confirmation email resent. Check your inbox.' });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
        <p className="mt-1 text-sm text-foreground-muted">Sign in to your workspace</p>
      </div>

      {alert && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-md border border-risk-hard-border bg-risk-hard-bg p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-risk-hard" aria-hidden="true" />
          <div className="flex-1 text-sm text-risk-hard">
            <p>{alert.message}</p>
            {alert.type === 'unconfirmed' && (
              <button
                type="button"
                onClick={handleResend}
                className="mt-1 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-risk-hard rounded"
              >
                Resend confirmation email
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAlert(null)}
            aria-label="Dismiss"
            className="shrink-0 text-risk-hard opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-risk-hard rounded"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="login-email"
          label="Email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          disabled={loading}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Input
          id="login-password"
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          disabled={loading}
          autoComplete="current-password"
        />
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Sign In
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-foreground-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
