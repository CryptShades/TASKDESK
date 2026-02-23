import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/services/auth/client';
import { getEscalations } from '@/services/escalation.service';
import { PageHeader } from '@/components/ui/page-header';
import { EscalationsList } from '@/components/escalations/escalations-list';

export const metadata = {
  title: 'Escalations Center | Taskdesk',
};

export const dynamic = 'force-dynamic';

export default async function EscalationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  // Founder only access
  if (currentUser.role !== 'founder') {
    redirect('/403');
  }

  const escalations = await getEscalations(currentUser.org_id);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Escalations Center" 
        subtitle="Critical risk monitoring hub for founders. Track at-risk campaigns and managed interventions."
      />
      
      <EscalationsList initialEscalations={escalations} />
    </div>
  );
}
