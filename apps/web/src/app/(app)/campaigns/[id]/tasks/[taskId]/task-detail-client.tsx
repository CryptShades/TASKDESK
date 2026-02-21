'use client';

import { useState } from 'react';
import { TaskStatusModal } from '@/components/campaigns/task-status-modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatusSelector } from '@/components/ui/status-selector';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '../../../../../../../supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];

interface User {
  id: string;
  name: string;
}

interface DependencyTask {
  id: string;
  title: string;
  status: TaskStatus;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dependency_id: string | null;
  dependency: DependencyTask | null;
  owner: User;
}

interface Props {
  task: Task;
  currentUserId: string;
  campaignId: string;
}

export function TaskDetailClient({ task: initialTask, currentUserId, campaignId }: Props) {
  const [task, setTask] = useState(initialTask);
  const [pendingStatus, setPendingStatus] = useState<TaskStatus>(task.status);
  const [modalOpen, setModalOpen] = useState(false);

  const isOwner = currentUserId === task.owner.id;
  const depIncomplete = task.dependency && task.dependency.status !== 'completed';

  const handleStatusSuccess = (updated: { id: string; status: TaskStatus }) => {
    setTask((prev) => ({ ...prev, status: updated.status }));
    setPendingStatus(updated.status);
    setModalOpen(false);
  };

  return (
    <>
      {/* Current Status Display */}
      <div className="flex items-center gap-3">
        <StatusBadge status={task.status} size="lg" />
      </div>

      {/* Dependency warning */}
      {isOwner && depIncomplete && (
        <div className="flex items-start gap-2 rounded-md border border-risk-soft-border bg-risk-soft-bg px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-risk-soft" />
          <p className="text-sm text-risk-soft">
            Cannot start — <strong>{task.dependency!.title}</strong> not yet completed.
          </p>
        </div>
      )}

      {/* Status Selector (owner only) */}
      {isOwner && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Change Status
          </p>
          <StatusSelector
            currentStatus={pendingStatus}
            onChange={setPendingStatus}
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => setModalOpen(true)}
            className="w-full"
          >
            Update Status
          </Button>
        </div>
      )}

      {/* Dependency completed info */}
      {task.dependency && task.dependency.status === 'completed' && (
        <div className="flex items-center gap-2 rounded-md border border-risk-normal-border bg-risk-normal-bg px-3 py-2">
          <CheckCircle className="h-4 w-4 text-risk-normal flex-shrink-0" />
          <p className="text-xs text-risk-normal">
            Dependency <strong>{task.dependency.title}</strong> is completed. Ready to start.
          </p>
        </div>
      )}

      {/* Status Update Modal */}
      {modalOpen && (
        <TaskStatusModal
          task={{ ...task, dependency: task.dependency }}
          onClose={() => setModalOpen(false)}
          onSuccess={handleStatusSuccess}
        />
      )}
    </>
  );
}
