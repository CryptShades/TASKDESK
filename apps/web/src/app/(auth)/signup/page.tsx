'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  orgName?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = 'Full name is required';
    }
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
    if (!orgName.trim()) {
      errors.orgName = 'Organization name is required';
    } else if (orgName.trim().length < 2 || orgName.trim().length > 100) {
      errors.orgName = 'Organization name must be between 2 and 100 characters';
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          orgName: orgName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorCode = data.error?.code ?? '';
        const errorMessage = (data.error?.message ?? '').toLowerCase();

        if (
          errorMessage.includes('already registered') ||
          errorMessage.includes('already exists') ||
          errorCode === 'USER_ALREADY_EXISTS' ||
          errorCode === 'AUTH_SIGNUP_FAILED'
        ) {
          setAlert(
            'An account with this email already exists. Sign in instead.'
          );
        } else {
          setAlert('Account creation failed. Please try again.');
        }
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setAlert('Account creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">Create your account</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Start tracking your campaigns
        </p>
      </div>

      {alert && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-md border border-risk-hard-border bg-risk-hard-bg p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-risk-hard" aria-hidden="true" />
          <p className="flex-1 text-sm text-risk-hard">{alert}</p>
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
          id="signup-name"
          label="Full Name"
          type="text"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          disabled={loading}
          placeholder="Jane Smith"
          autoComplete="name"
        />
        <Input
          id="signup-email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          disabled={loading}
          placeholder="you@company.com"
          autoComplete="email"
        />
        <Input
          id="signup-password"
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          disabled={loading}
          autoComplete="new-password"
          hint="Minimum 8 characters"
        />
        <Input
          id="signup-org"
          label="Organization Name"
          type="text"
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          error={fieldErrors.orgName}
          disabled={loading}
          placeholder="Acme Agency"
          autoComplete="organization"
        />
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded">
          Sign in
        </Link>
      </p>
    </div>
  );
}
