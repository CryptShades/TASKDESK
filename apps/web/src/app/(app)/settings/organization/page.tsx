'use client';

import React from 'react';
import { useUser } from '@/context/user-context';
import { OrganizationForm } from '@/components/settings/organization-form';
import { ShieldAlert } from 'lucide-react';

export default function OrganizationSettingsPage() {
  const { currentUser } = useUser();

  if (!currentUser) return null;

  if (currentUser.role !== 'founder') {
    return (
      <div className="p-12 flex flex-col items-center text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-risk-hard/10 flex items-center justify-center text-risk-hard">
          <ShieldAlert className="h-6 f-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-sm text-foreground-muted max-w-sm mx-auto">
            Organization settings are restricted to company founders. 
            Contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      <div className="p-6">
        <h1 className="text-xl font-bold">Organization Settings</h1>
        <p className="text-sm text-foreground-muted">
          Manage workspace identity and global configuration.
        </p>
      </div>
      <OrganizationForm />
    </div>
  );
}
