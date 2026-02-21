'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileForm() {
  const { currentUser, refetch } = useUser();
  const [name, setName] = useState(currentUser?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
    }
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
      const res = await fetch('/api/org/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      await refetch();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!currentUser) return null;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder="Your name"
            required
          />
        </div>

        {/* Email - Read-only */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Email Address
          </label>
          <Input
            value={currentUser.email}
            disabled
            className="bg-surface-raised opacity-70 cursor-not-allowed"
          />
          <p className="text-xs text-foreground-muted">
            Email cannot be changed in v1.
          </p>
        </div>

        {/* Role - Read-only Badge */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Your Role
          </label>
          <div>
            <Badge variant="outline" className="capitalize">
              {currentUser.role}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" loading={loading}>
          Save Changes
        </Button>
        
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-500 animate-in fade-in slide-in-from-left-2">
            <Check className="h-4 w-4" />
            Profile updated
          </div>
        )}

        {error && (
          <p className="text-sm text-risk-hard">{error}</p>
        )}
      </div>
    </form>
  );
}
