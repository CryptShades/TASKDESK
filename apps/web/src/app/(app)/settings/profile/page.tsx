import React from 'react';
import { ProfileForm } from '@/components/settings/profile-form';

export default function ProfileSettingsPage() {
  return (
    <div className="divide-y divide-border">
      <div className="p-6">
        <h1 className="text-xl font-bold">My Profile</h1>
        <p className="text-sm text-foreground-muted">
          Manage your personal information and account settings.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
