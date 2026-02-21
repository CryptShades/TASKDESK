import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runRiskEngine } from '../risk-engine';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock escalation processor to avoid DB side effects
vi.mock('../escalation-processor', () => ({
  processEscalations: vi.fn(),
}));

describe('Risk Engine', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    };
  });

  it('sets soft_risk for tasks not updated within 24h of assignment', async () => {
    const now = new Date();
    const staleDate = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
    
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') return { data: [{ id: 'org-1' }] };
      if (table === 'tasks') return { 
        data: [{ 
          id: 'task-1', 
          status: 'not_started', 
          assigned_at: staleDate, 
          risk_flag: null,
          org_id: 'org-1'
        }],
        update: vi.fn().mockResolvedValue({ error: null })
      };
      if (table === 'campaigns') return { data: [] };
      return { data: [] };
    });

    const result = await runRiskEngine(mockSupabase as unknown as SupabaseClient, 'org-1');
    expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
    expect(mockSupabase.update).toHaveBeenCalledWith({ risk_flag: 'soft_risk' });
  });

  it('sets hard_risk for overdue tasks', async () => {
    const now = new Date();
    const overdueDate = new Date(now.getTime() - 1000).toISOString();
    
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') return { data: [{ id: 'org-1' }] };
      if (table === 'tasks') return { 
        data: [{ 
          id: 'task-1', 
          status: 'in_progress', 
          due_date: overdueDate, 
          risk_flag: null,
          org_id: 'org-1'
        }],
        update: vi.fn().mockResolvedValue({ error: null })
      };
      if (table === 'campaigns') return { data: [] };
      return { data: [] };
    });

    await runRiskEngine(mockSupabase as unknown as SupabaseClient, 'org-1');
    expect(mockSupabase.update).toHaveBeenCalledWith({ risk_flag: 'hard_risk' });
  });

  it('sets high_risk for campaigns with 3+ hard risk tasks', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') return { data: [{ id: 'org-1' }] };
      if (table === 'tasks') return { data: [] };
      if (table === 'campaigns') return { 
        data: [{ 
          id: 'camp-1', 
          risk_status: 'normal',
          launch_date: new Date(Date.now() + 1000000).toISOString(),
          tasks: [
            { risk_flag: 'hard_risk', status: 'in_progress' },
            { risk_flag: 'hard_risk', status: 'in_progress' },
            { risk_flag: 'hard_risk', status: 'in_progress' }
          ]
        }]
      };
      return { data: [] };
    });

    await runRiskEngine(mockSupabase as unknown as SupabaseClient, 'org-1');
    expect(mockSupabase.update).toHaveBeenCalledWith({ risk_status: 'high_risk' });
  });
});
