'use client';

import React from 'react';
import { useUser } from '@/context/user-context';
import { MemberList } from '@/components/settings/member-list';
import { ShieldAlert } from 'lucide-react';

export default function MembersSettingsPage() {
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
            Team management settings are restricted to company founders. 
            Contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface overflow-hidden">
      <MemberList />
    </div>
  );
}
