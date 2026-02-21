'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Client {
  id: string;
  name: string;
}

interface FieldErrors {
  clientId?: string;
  name?: string;
  launchDate?: string;
  newClientName?: string;
}

function minLaunchDate(): string {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  // datetime-local needs "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewCampaignPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const [clientId, setClientId] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [launchDate, setLaunchDate] = useState('');

  // Inline new-client creation
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientLoading, setNewClientLoading] = useState(false);
  const newClientInputRef = useRef<HTMLInputElement>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load clients on mount
  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then(({ data }) => {
        setClients(data ?? []);
      })
      .catch(() => {})
      .finally(() => setClientsLoading(false));
  }, []);

  // Focus new client input when shown
  useEffect(() => {
    if (showNewClient) {
      newClientInputRef.current?.focus();
    }
  }, [showNewClient]);

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!clientId) {
      errors.clientId = 'Select a client or create a new one.';
    }

    const trimmedName = campaignName.trim();
    if (!trimmedName) {
      errors.name = 'Campaign name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Campaign name must be at least 2 characters.';
    } else if (trimmedName.length > 150) {
      errors.name = 'Campaign name must be 150 characters or fewer.';
    }

    if (!launchDate) {
      errors.launchDate = 'Launch date is required.';
    } else {
      const picked = new Date(launchDate);
      const min = new Date();
      min.setHours(min.getHours() + 24);
      if (picked < min) {
        errors.launchDate = 'Launch date must be at least 24 hours from now.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreateClient() {
    const name = newClientName.trim();
    if (!name) {
      setFieldErrors((prev) => ({ ...prev, newClientName: 'Client name is required.' }));
      return;
    }
    if (name.length < 2) {
      setFieldErrors((prev) => ({ ...prev, newClientName: 'Client name must be at least 2 characters.' }));
      return;
    }

    setNewClientLoading(true);
    setFieldErrors((prev) => ({ ...prev, newClientName: undefined }));

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        const msg = json.error?.code === 'NAME_EXISTS'
          ? 'A client with this name already exists.'
          : (json.error?.message ?? 'Failed to create client. Try again.');
        setFieldErrors((prev) => ({ ...prev, newClientName: msg }));
        return;
      }

      const created: Client = json.data;
      setClients((prev) => [created, ...prev]);
      setClientId(created.id);
      setNewClientName('');
      setShowNewClient(false);
      // Clear any prior clientId error
      setFieldErrors((prev) => ({ ...prev, clientId: undefined }));
    } catch {
      setFieldErrors((prev) => ({ ...prev, newClientName: 'Network error. Please try again.' }));
    } finally {
      setNewClientLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          name: campaignName.trim(),
          launch_date: new Date(launchDate).toISOString(),
        }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        if (json.error?.code === 'INVALID_LAUNCH_DATE') {
          setFieldErrors((prev) => ({
            ...prev,
            launchDate: 'Launch date must be in the future.',
          }));
        } else {
          setSubmitError(json.error?.message ?? 'Failed to create campaign. Please try again.');
        }
        return;
      }

      const campaign = json.data;
      router.push(`/campaigns/${campaign.id}/tasks/new`);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const minDate = minLaunchDate();

  return (
    <div className="p-6">
      <div className="mx-auto max-w-lg">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">New Campaign</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Add a campaign to start tracking tasks and risk.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Submit-level error */}
          {submitError && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start justify-between gap-3 rounded-md border border-risk-hard-border bg-risk-hard-bg px-4 py-3"
            >
              <p className="text-sm text-risk-hard">{submitError}</p>
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="mt-0.5 shrink-0 text-risk-hard opacity-70 hover:opacity-100 focus:outline-none"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Client selector */}
          <div className="space-y-1">
            <label
              htmlFor="client-select"
              className="block text-sm font-medium uppercase tracking-wide text-foreground-muted"
            >
              Client
            </label>

            {!showNewClient ? (
              <div className="flex items-center gap-2">
                <select
                  id="client-select"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, clientId: undefined }));
                  }}
                  disabled={clientsLoading}
                  aria-invalid={fieldErrors.clientId ? 'true' : undefined}
                  className={[
                    'h-10 flex-1 rounded-md border bg-input px-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50',
                    fieldErrors.clientId
                      ? 'border-risk-hard focus:ring-risk-hard'
                      : 'border-border',
                  ].join(' ')}
                >
                  <option value="">
                    {clientsLoading ? 'Loading clients…' : 'Select a client…'}
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewClient(true);
                    setFieldErrors((prev) => ({ ...prev, clientId: undefined }));
                  }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-surface-raised px-3 text-sm text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  title="Create a new client"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      ref={newClientInputRef}
                      type="text"
                      placeholder="Client name"
                      value={newClientName}
                      onChange={(e) => {
                        setNewClientName(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, newClientName: undefined }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateClient();
                        }
                        if (e.key === 'Escape') {
                          setShowNewClient(false);
                          setNewClientName('');
                          setFieldErrors((prev) => ({ ...prev, newClientName: undefined }));
                        }
                      }}
                      aria-invalid={fieldErrors.newClientName ? 'true' : undefined}
                      className={[
                        'block h-10 w-full rounded-md border bg-input px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary',
                        fieldErrors.newClientName
                          ? 'border-risk-hard focus:ring-risk-hard'
                          : 'border-border',
                      ].join(' ')}
                    />
                    {fieldErrors.newClientName && (
                      <p role="alert" className="mt-1 text-sm text-risk-hard">
                        {fieldErrors.newClientName}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    loading={newClientLoading}
                    onClick={handleCreateClient}
                  >
                    Add
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewClient(false);
                      setNewClientName('');
                      setFieldErrors((prev) => ({ ...prev, newClientName: undefined }));
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Cancel new client"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-foreground-subtle">
                  Press Enter to add or Esc to cancel.
                </p>
              </div>
            )}

            {fieldErrors.clientId && (
              <p role="alert" className="text-sm text-risk-hard">
                {fieldErrors.clientId}
              </p>
            )}
          </div>

          {/* Campaign name */}
          <Input
            id="campaign-name"
            label="Campaign Name"
            type="text"
            placeholder="e.g. Q3 Product Launch"
            value={campaignName}
            onChange={(e) => {
              setCampaignName(e.target.value);
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={fieldErrors.name}
            maxLength={150}
          />

          {/* Launch date */}
          <Input
            id="launch-date"
            label="Launch Date"
            type="datetime-local"
            value={launchDate}
            min={minDate}
            onChange={(e) => {
              setLaunchDate(e.target.value);
              setFieldErrors((prev) => ({ ...prev, launchDate: undefined }));
            }}
            error={fieldErrors.launchDate}
            hint="Must be at least 24 hours from now."
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/campaigns"
              className="inline-flex h-10 items-center rounded-md border border-border bg-surface-raised px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-overlay focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              Cancel
            </Link>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Create Campaign
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
