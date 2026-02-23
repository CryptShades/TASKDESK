import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser } from '@/services/auth/server';
import { getClients } from '@/services/client.service';

export const metadata = {
  title: 'Clients | Taskdesk',
};

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  let currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    currentUser = await getCurrentUser();
  } catch {
    redirect('/login');
  }

  if (currentUser.role === 'member') {
    redirect('/403');
  }

  const clients = await getClients(currentUser.org_id);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="Clients"
        subtitle="Manage client accounts for your organization."
        action={
          <Link
            href="/campaigns/new"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            + New Campaign
          </Link>
        }
      />

      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-foreground-muted">No clients yet.</p>
            <p className="mt-1 text-xs text-foreground-subtle">
              Add your first client while creating a campaign.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-left text-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{client.name}</td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
