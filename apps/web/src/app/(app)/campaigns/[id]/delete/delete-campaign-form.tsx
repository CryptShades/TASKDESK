'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface DeleteCampaignFormProps {
  campaignId: string;
}

export function DeleteCampaignForm({ campaignId }: DeleteCampaignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload?.error?.message ||
          payload?.error ||
          payload?.message ||
          'Failed to delete campaign.';
        setError(message);
        return;
      }

      router.push('/campaigns');
      router.refresh();
    } catch {
      setError('Failed to delete campaign.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="danger"
        loading={loading}
        disabled={loading}
        onClick={handleDelete}
      >
        Delete Campaign Permanently
      </Button>
      {error && <p className="text-sm text-risk-hard">{error}</p>}
    </div>
  );
}
