import { describe, it, expect } from 'vitest';
import { evaluateTaskRisk, calculateCampaignRisk } from '../workers/risk-engine';

describe('evaluateTaskRisk', () => {
  it('returns soft_risk for task assigned 25h ago, status = not_started, no events', () => {
    const now = new Date();
    const assignedAt = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const task = {
      id: '1',
      status: 'not_started' as const,
      assigned_at: assignedAt.toISOString(),
      dependency_id: null,
      due_date: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      risk_flag: null,
    };
    const taskEvents: any[] = [];

    const result = evaluateTaskRisk(task, taskEvents, now);
    expect(result).toBe('soft_risk');
  });

  it('returns null for task assigned 20h ago, status = not_started, no events', () => {
    const now = new Date();
    const assignedAt = new Date(now.getTime() - 20 * 60 * 60 * 1000);
    const task = {
      id: '1',
      status: 'not_started' as const,
      assigned_at: assignedAt.toISOString(),
      dependency_id: null,
      due_date: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      risk_flag: null,
    };
    const taskEvents: any[] = [];

    const result = evaluateTaskRisk(task, taskEvents, now);
    expect(result).toBe(null);
  });

  it('returns soft_risk for task with dependency completed 13h ago, status = not_started', () => {
    const now = new Date();
    const completedAt = new Date(now.getTime() - 13 * 60 * 60 * 1000);
    const task = {
      id: '1',
      status: 'not_started' as const,
      assigned_at: null,
      dependency_id: 'dep1',
      due_date: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      risk_flag: null,
    };
    const taskEvents = [
      {
        task_id: 'dep1',
        event_type: 'status_changed',
        new_value: 'completed',
        created_at: completedAt.toISOString(),
      },
    ];

    const result = evaluateTaskRisk(task, taskEvents, now);
    expect(result).toBe('soft_risk');
  });

  it('returns null for task with dependency completed 8h ago, status = not_started', () => {
    const now = new Date();
    const completedAt = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const task = {
      id: '1',
      status: 'not_started' as const,
      assigned_at: null,
      dependency_id: 'dep1',
      due_date: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      risk_flag: null,
    };
    const taskEvents = [
      {
        task_id: 'dep1',
        event_type: 'status_changed',
        new_value: 'completed',
        created_at: completedAt.toISOString(),
      },
    ];

    const result = evaluateTaskRisk(task, taskEvents, now);
    expect(result).toBe(null);
  });

  it('returns hard_risk for task due_date 2h ago, status = in_progress', () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const task = {
      id: '1',
      status: 'in_progress' as const,
      assigned_at: null,
      dependency_id: null,
      due_date: dueDate.toISOString(),
      risk_flag: null,
    };
    const taskEvents: any[] = [];

    const result = evaluateTaskRisk(task, taskEvents, now);
    expect(result).toBe('hard_risk');
  });

  it('returns null for task due_date 2h in future, status = in_progress', () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const task = {
      id: '1',
      status: 'in_progress' as const,
      assigned_at: null,
      dependency_id: null,
      due_date: dueDate.toISOString(),
      risk_flag: null,
    };
    const taskEvents: any[] = [];

    const result = evaluateTaskRisk(task, taskEvents, now);
    expect(result).toBe(null);
  });

  it('returns hard_risk for task status = blocked, blocked_event 25h ago', () => {
    const now = new Date();
    const blockedAt = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const task = {
      id: '1',
      status: 'blocked' as const,
      assigned_at: null,
      dependency_id: null,
      due_date: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      risk_flag: null,
    };
    const taskEvents = [
      {
        task_id: '1',
        event_type: 'status_changed',
        new_value: 'blocked',
        created_at: blockedAt.toISOString(),
      },
    ];

    const result = evaluateTaskRisk(task, taskEvents, now);
    expect(result).toBe('hard_risk');
  });

  it('returns soft_risk for task status = blocked, blocked_event 20h ago', () => {
    const now = new Date();
    const blockedAt = new Date(now.getTime() - 20 * 60 * 60 * 1000);
    const task = {
      id: '1',
      status: 'blocked' as const,
      assigned_at: null,
      dependency_id: null,
      due_date: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      risk_flag: null,
    };
    const taskEvents = [
      {
        task_id: '1',
        event_type: 'status_changed',
        new_value: 'blocked',
        created_at: blockedAt.toISOString(),
      },
    ];

    const result = evaluateTaskRisk(task, taskEvents, now);
    expect(result).toBe('soft_risk');
  });

  it('returns null for task status = completed', () => {
    const now = new Date();
    const task = {
      id: '1',
      status: 'completed' as const,
      assigned_at: null,
      dependency_id: null,
      due_date: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      risk_flag: null,
    };
    const taskEvents: any[] = [];

    const result = evaluateTaskRisk(task, taskEvents, now);
    expect(result).toBe(null);
  });

  it('returns hard_risk for task with existing risk_flag = hard_risk being re-evaluated', () => {
    const now = new Date();
    const task = {
      id: '1',
      status: 'not_started' as const,
      assigned_at: null,
      dependency_id: null,
      due_date: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      risk_flag: 'hard_risk' as const,
    };
    const taskEvents: any[] = [];

    const result = evaluateTaskRisk(task, taskEvents, now);
    expect(result).toBe('hard_risk');
  });
});

describe('calculateCampaignRisk', () => {
  it('returns normal for campaign with 0 tasks', () => {
    const now = new Date();
    const campaign = {
      id: '1',
      launch_date: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    };
    const tasks: any[] = [];

    const result = calculateCampaignRisk(campaign, tasks, now);
    expect(result).toBe('normal');
  });

  it('returns normal for campaign with all tasks completed', () => {
    const now = new Date();
    const campaign = {
      id: '1',
      launch_date: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    };
    const tasks = [
      { status: 'completed' as const, risk_flag: null },
      { status: 'completed' as const, risk_flag: null },
    ];

    const result = calculateCampaignRisk(campaign, tasks, now);
    expect(result).toBe('normal');
  });

  it('returns normal for campaign with 1 hard_risk task', () => {
    const now = new Date();
    const campaign = {
      id: '1',
      launch_date: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    };
    const tasks = [
      { status: 'in_progress' as const, risk_flag: 'hard_risk' as const },
      { status: 'completed' as const, risk_flag: null },
    ];

    const result = calculateCampaignRisk(campaign, tasks, now);
    expect(result).toBe('normal');
  });

  it('returns high_risk for campaign with 3 hard_risk tasks', () => {
    const now = new Date();
    const campaign = {
      id: '1',
      launch_date: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    };
    const tasks = [
      { status: 'in_progress' as const, risk_flag: 'hard_risk' as const },
      { status: 'in_progress' as const, risk_flag: 'hard_risk' as const },
      { status: 'in_progress' as const, risk_flag: 'hard_risk' as const },
    ];

    const result = calculateCampaignRisk(campaign, tasks, now);
    expect(result).toBe('high_risk');
  });

  it('returns at_risk for campaign with 2 delayed tasks (soft_risk)', () => {
    const now = new Date();
    const campaign = {
      id: '1',
      launch_date: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    };
    const tasks = [
      { status: 'in_progress' as const, risk_flag: 'soft_risk' as const },
      { status: 'in_progress' as const, risk_flag: 'soft_risk' as const },
    ];

    const result = calculateCampaignRisk(campaign, tasks, now);
    expect(result).toBe('at_risk');
  });

  it('returns high_risk for campaign launch_date passed, tasks incomplete', () => {
    const now = new Date();
    const campaign = {
      id: '1',
      launch_date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    };
    const tasks = [
      { status: 'in_progress' as const, risk_flag: null },
    ];

    const result = calculateCampaignRisk(campaign, tasks, now);
    expect(result).toBe('high_risk');
  });

  it('returns at_risk for campaign launch in 47h with 2 pending tasks', () => {
    const now = new Date();
    const campaign = {
      id: '1',
      launch_date: new Date(now.getTime() + 47 * 60 * 60 * 1000).toISOString(),
    };
    const tasks = [
      { status: 'in_progress' as const, risk_flag: null },
      { status: 'in_progress' as const, risk_flag: null },
    ];

    const result = calculateCampaignRisk(campaign, tasks, now);
    expect(result).toBe('at_risk');
  });

  it('returns normal for campaign launch in 49h with 2 pending tasks', () => {
    const now = new Date();
    const campaign = {
      id: '1',
      launch_date: new Date(now.getTime() + 49 * 60 * 60 * 1000).toISOString(),
    };
    const tasks = [
      { status: 'in_progress' as const, risk_flag: null },
      { status: 'in_progress' as const, risk_flag: null },
    ];

    const result = calculateCampaignRisk(campaign, tasks, now);
    expect(result).toBe('normal');
  });
});