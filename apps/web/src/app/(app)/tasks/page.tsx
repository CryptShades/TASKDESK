import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/auth/client';
import { getMyTasks } from '@/services/task.service';
import { PageHeader } from '@/components/ui/page-header';
import { MyTasksView } from '@/components/tasks/my-tasks-view';

export const metadata = {
  title: 'My Tasks | Taskdesk',
};

export default async function MyTasksPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/auth/signin');
  }

  const tasks = await getMyTasks(currentUser.id, currentUser.org_id);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="My Tasks" 
        subtitle="Manage your personal assignments and deadlines across all active campaigns."
      />
      
      <MyTasksView initialTasks={tasks} />
    </div>
  );
}
