'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, AlertTriangle, Building2 } from 'lucide-react';

export function OrganizationForm() {
  const { currentUser } = useUser();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Note: we might need a separate fetch for organization details if not in context
  // For now, assuming org name is available or we fetch it
  useEffect(() => {
    async function fetchOrg() {
      if (!currentUser?.org_id) return;
      try {
        const res = await fetch(`/api/org/settings`); // We can reuse this or a GET
        const data = await res.json();
        if (data.data) {
          setName(data.data.name);
        }
      } catch (err) {
        console.error('Failed to fetch org:', err);
      }
    }
    fetchOrg();
  }, [currentUser]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/org/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update organization');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Workspace Settings</h2>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="orgName" className="text-sm font-medium text-foreground">
              Organization Name
            </label>
            <Input
              id="orgName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder="Your organization name"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" loading={loading}>
            Save Organization
          </Button>
          
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-500 animate-in fade-in slide-in-from-left-2">
              <Check className="h-4 w-4" />
              Organization updated
            </div>
          )}

          {error && (
            <p className="text-sm text-risk-hard">{error}</p>
          )}
        </div>
      </form>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-border">
        <div className="rounded-lg border border-risk-hard-border bg-risk-hard/5 p-4 space-y-4">
          <div className="flex items-center gap-2 text-risk-hard font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete Organization</p>
              <p className="text-xs text-foreground-muted">
                Contact support to delete your organization. This action cannot be undone.
              </p>
            </div>
            <Button variant="outline" disabled className="text-risk-hard border-risk-hard-border opacity-50">
              Delete Organization
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
