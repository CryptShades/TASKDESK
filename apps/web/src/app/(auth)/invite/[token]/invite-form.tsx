'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InviteFormProps {
  token: string;
  email: string;
  orgName: string;
}

interface FieldErrors {
  name?: string;
  password?: string;
}

export function InviteForm({ token, email, orgName }: InviteFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = 'Full name is required';
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
      const response = await fetch('/api/auth/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorCode = data.error?.code ?? '';
        const errorMessage = (data.error?.message ?? '').toLowerCase();

        if (errorCode === 'INVALID_TOKEN' || errorMessage.includes('invalid') || errorMessage.includes('expired')) {
          setAlert('This invitation is invalid or has expired. Contact your workspace admin for a new invite.');
        } else {
          setAlert('Failed to accept invitation. Please try again.');
        }
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setAlert('Failed to accept invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">
          You&apos;ve been invited to{' '}
          <span className="text-primary">{orgName}</span> on Taskdesk
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Create your account to get started
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
          id="invite-name"
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
          id="invite-email"
          label="Email"
          type="email"
          value={email}
          readOnly
          disabled
          aria-readonly="true"
          className="cursor-not-allowed"
          autoComplete="off"
        />
        <Input
          id="invite-password"
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
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Accept Invitation
        </Button>
      </form>
    </div>
  );
}
