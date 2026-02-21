'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-risk-hard-bg rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-8 h-8 text-risk-hard" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        You do not have permission to view this page. This area is restricted to specific organization roles.
      </p>
      <div className="flex gap-4">
        <Button asChild variant="primary">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
