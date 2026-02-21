import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateTaskStatus } from '../task.service';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('Task Service - Status Transitions', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  it('allows transition to in_progress when no dependency exists', async () => {
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: 'task-1', status: 'not_started', dependency_id: null, owner_id: 'user-1', org_id: 'org-1' },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'task-1', status: 'in_progress' }, error: null });

    const result = await updateTaskStatus('task-1', 'in_progress', 'user-1', 'org-1');
    expect(result).toBeDefined();
  });

  it('blocks transition to in_progress when dependency is not completed', async () => {
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: 'task-1', status: 'not_started', dependency_id: 'dep-1', owner_id: 'user-1', org_id: 'org-1' },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'dep-1', status: 'in_progress' }, error: null });

    await expect(
      updateTaskStatus('task-1', 'in_progress', 'user-1', 'org-1')
    ).rejects.toThrow('Cannot start task until dependency is completed');
  });

  it('prevents updates to completed tasks (terminal state)', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'task-1', status: 'completed', owner_id: 'user-1', org_id: 'org-1' },
      error: null,
    });

    await expect(
      updateTaskStatus('task-1', 'in_progress', 'user-1', 'org-1')
    ).rejects.toThrow();
  });

  it('blocks non-owners from updating status', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'task-1', status: 'not_started', owner_id: 'user-1', org_id: 'org-1' },
      error: null,
    });

    await expect(
      updateTaskStatus('task-1', 'in_progress', 'user-2', 'org-1')
    ).rejects.toThrow('Only task owners can update task status');
  });
});
