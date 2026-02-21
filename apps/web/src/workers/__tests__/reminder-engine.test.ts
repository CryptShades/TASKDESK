import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runReminderEngine } from '../reminder-engine';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Reminder Engine', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };
    vi.clearAllMocks();
  });

  it('sends reminder for task due in 24h', async () => {
    const now = new Date();
    const dueSoon = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
    
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tasks') return { 
        data: [{ id: 'task-1', due_date: dueSoon, status: 'in_progress', owner_id: 'user-1', org_id: 'org-1' }] 
      };
      if (table === 'task_events') return { data: [] }; // No recent reminders
      return { data: [] };
    });

    await runReminderEngine(mockSupabase as unknown as SupabaseClient);
    
    // Check that notification was created
    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
      type: 'reminder',
      user_id: 'user-1'
    }));
  });

  it('does not send duplicate reminders if sent recently', async () => {
    const now = new Date();
    const dueSoon = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
    
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tasks') return { 
        data: [{ id: 'task-1', due_date: dueSoon, status: 'in_progress', owner_id: 'user-1', org_id: 'org-1' }] 
      };
      if (table === 'task_events') return { 
        data: [{ event_type: 'reminder_sent', created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() }] 
      };
      return { data: [] };
    });

    await runReminderEngine(mockSupabase as unknown as SupabaseClient);
    
    // Verify no insert into notifications
    const calls = mockSupabase.from.mock.calls.map((c: any) => c[0]);
    expect(calls).not.toContain('notifications');
  });

  it('identifies overdue tasks and sets hard_risk', async () => {
    const now = new Date();
    const overdueDate = new Date(now.getTime() - 1000).toISOString();
    
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tasks') return { 
        data: [{ id: 'task-1', due_date: overdueDate, status: 'in_progress', owner_id: 'user-1', org_id: 'org-1', risk_flag: null }] 
      };
      return { data: [] };
    });

    await runReminderEngine(mockSupabase as unknown as SupabaseClient);
    
    expect(mockSupabase.update).toHaveBeenCalledWith({ risk_flag: 'hard_risk' });
  });
});
