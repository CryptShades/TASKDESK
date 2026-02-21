'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Mail, Shield } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export function InviteModal({ isOpen, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to send invitation');
      }

      onSuccess(email);
      setEmail('');
      setRole('member');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface rounded-xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-raised">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Invite Team Member
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-foreground-muted hover:bg-border transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full h-10 px-3 py-2 bg-surface text-foreground text-sm border border-border rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="member">Member (View & update own tasks)</option>
                  <option value="manager">Manager (Create campaigns & manage team)</option>
                </select>
                <Shield className="absolute right-3 top-3 h-4 w-4 text-foreground-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-risk-hard">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Send Invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
