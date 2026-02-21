'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Database } from '../../../../../../../supabase/types';

export const dynamic = 'force-dynamic';

type TaskStatus = Database['public']['Enums']['task_status'];

interface Member {
  id: string;
  name: string;
  email: string;
}

interface CampaignTask {
  id: string;
  title: string;
  status: TaskStatus;
}

interface FieldErrors {
  title?: string;
  owner_id?: string;
  due_date?: string;
}

function formatDatetimeLocal(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface PageProps {
  params: { id: string };
  searchParams: { campaignLaunchDate?: string; campaignName?: string };
}

export default function NewTaskPage({ params }: PageProps) {
  const router = useRouter();
  const campaignId = params.id;

  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<CampaignTask[]>([]);
  const [campaign, setCampaign] = useState<{ launch_date: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dependencyId, setDependencyId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load campaign, members, and tasks
  useEffect(() => {
    Promise.all([
      fetch(`/api/campaigns/${campaignId}`).then((r) => r.json()),
      fetch('/api/org/members').then((r) => r.json()),
      fetch(`/api/campaigns/${campaignId}/tasks`).then((r) => r.json()),
    ])
      .then(([campaignRes, membersRes, tasksRes]) => {
        if (campaignRes.data) setCampaign(campaignRes.data);
        if (membersRes.data) setMembers(membersRes.data);
        if (tasksRes.data) setTasks(tasksRes.data);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [campaignId]);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!title.trim()) errors.title = 'Task title is required.';
    else if (title.trim().length < 2) errors.title = 'Title must be at least 2 characters.';
    else if (title.trim().length > 200) errors.title = 'Title must be 200 characters or fewer.';

    if (!ownerId) errors.owner_id = 'Select a task owner.';

    if (!dueDate) {
      errors.due_date = 'Due date is required.';
    } else {
      const picked = new Date(dueDate);
      const now = new Date();
      if (picked <= now) errors.due_date = 'Due date must be in the future.';
      if (campaign && picked > new Date(campaign.launch_date)) {
        errors.due_date = 'Due date cannot exceed the campaign launch date.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submitTask(): Promise<string | null> {
    const res = await fetch(`/api/campaigns/${campaignId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        owner_id: ownerId,
        due_date: new Date(dueDate).toISOString(),
        dependency_id: dependencyId || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      return json.error?.message ?? 'Failed to create task. Please try again.';
    }
    return null;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const err = await submitTask();
      if (err) { setSubmitError(err); return; }
      router.push(`/campaigns/${campaignId}`);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAnother(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const err = await submitTask();
      if (err) { setSubmitError(err); return; }
      // Reset form, reload tasks list
      setTitle('');
      setOwnerId('');
      setOwnerSearch('');
      setDueDate('');
      setDependencyId('');
      setFieldErrors({});
      // Refresh tasks list for dependency dropdown
      fetch(`/api/campaigns/${campaignId}/tasks`)
        .then((r) => r.json())
        .then(({ data }) => setTasks(data ?? []));
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const maxDate = campaign ? formatDatetimeLocal(campaign.launch_date) : undefined;

  const filteredMembers = ownerSearch.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
          m.email.toLowerCase().includes(ownerSearch.toLowerCase())
      )
    : members;

  const selectedOwner = members.find((m) => m.id === ownerId);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/campaigns/${campaignId}`}
            className="mb-2 inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground focus:outline-none"
          >
            ← Back to Campaign
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">New Task</h1>
          {campaign && (
            <p className="mt-1 text-sm text-foreground-muted">
              Campaign launches{' '}
              <span className="font-medium text-foreground">
                {new Date(campaign.launch_date).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </span>
            </p>
          )}
        </div>

        <form onSubmit={handleCreate} noValidate className="space-y-6">
          {/* Submit error */}
          {submitError && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start justify-between gap-3 rounded-md border border-risk-hard-border bg-risk-hard-bg px-4 py-3"
            >
              <p className="text-sm text-risk-hard">{submitError}</p>
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="mt-0.5 shrink-0 text-risk-hard opacity-70 hover:opacity-100 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Task Title */}
          <Input
            id="task-title"
            label="Task Title"
            type="text"
            placeholder="e.g. Design landing page mockup"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setFieldErrors((prev) => ({ ...prev, title: undefined }));
            }}
            error={fieldErrors.title}
            maxLength={200}
          />

          {/* Owner */}
          <div className="space-y-1">
            <label className="block text-sm font-medium uppercase tracking-wide text-foreground-muted">
              Owner
            </label>

            {selectedOwner && (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2">
                <Avatar name={selectedOwner.name} size="sm" />
                <span className="text-sm text-foreground">{selectedOwner.name}</span>
                <button
                  type="button"
                  onClick={() => { setOwnerId(''); setOwnerSearch(''); }}
                  className="ml-auto text-foreground-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {!selectedOwner && (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                  <input
                    type="search"
                    placeholder="Search members…"
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    disabled={dataLoading}
                    className="h-10 w-full rounded-md border border-border bg-input pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>
                {filteredMembers.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-surface">
                    {filteredMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setOwnerId(m.id);
                          setOwnerSearch('');
                          setFieldErrors((prev) => ({ ...prev, owner_id: undefined }));
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-raised focus:outline-none focus:bg-surface-raised"
                      >
                        <Avatar name={m.name} size="sm" />
                        <div>
                          <p className="font-medium text-foreground">{m.name}</p>
                          <p className="text-xs text-foreground-muted">{m.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {fieldErrors.owner_id && (
              <p role="alert" className="text-sm text-risk-hard">{fieldErrors.owner_id}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <Input
              id="due-date"
              label="Due Date"
              type="datetime-local"
              value={dueDate}
              max={maxDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setFieldErrors((prev) => ({ ...prev, due_date: undefined }));
              }}
              error={fieldErrors.due_date}
              hint={campaign ? `Campaign launches ${new Date(campaign.launch_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : undefined}
            />
          </div>

          {/* Dependency */}
          <div className="space-y-1">
            <label
              htmlFor="dependency-select"
              className="block text-sm font-medium uppercase tracking-wide text-foreground-muted"
            >
              Dependency{' '}
              <span className="text-foreground-subtle normal-case tracking-normal">(optional)</span>
            </label>
            <select
              id="dependency-select"
              value={dependencyId}
              onChange={(e) => setDependencyId(e.target.value)}
              disabled={dataLoading || tasks.length === 0}
              className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">No dependency</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} – {t.status.replace('_', ' ')}
                </option>
              ))}
            </select>
            {tasks.length === 0 && !dataLoading && (
              <p className="text-xs text-foreground-muted">No other tasks in this campaign yet.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <Link
              href={`/campaigns/${campaignId}`}
              className="inline-flex h-10 items-center rounded-md border border-border bg-transparent px-4 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Cancel
            </Link>
            <Button
              type="button"
              variant="secondary"
              size="md"
              loading={loading}
              onClick={handleAddAnother}
            >
              Add Another
            </Button>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
