import { describe, it, expect } from 'vitest';
import { determineEscalationStage } from '../workers/escalation-processor';

describe('determineEscalationStage', () => {
  it('returns 1 for task with risk_flag, no previous escalation events', () => {
    const now = new Date();
    const task = {
      id: '1',
      risk_flag: 'soft_risk' as const,
      status: 'in_progress' as const,
    };
    const taskEvents: any[] = [];

    const result = determineEscalationStage(task, taskEvents, now);
    expect(result).toBe(1);
  });

  it('returns null for Stage 1 fired 11h ago (cooldown not elapsed)', () => {
    const now = new Date();
    const stage1Time = new Date(now.getTime() - 11 * 60 * 60 * 1000);
    const task = {
      id: '1',
      risk_flag: 'soft_risk' as const,
      status: 'in_progress' as const,
    };
    const taskEvents = [
      {
        event_type: 'escalation_stage_1',
        created_at: stage1Time.toISOString(),
      },
    ];

    const result = determineEscalationStage(task, taskEvents, now);
    expect(result).toBe(null);
  });

  it('returns 1 for Stage 1 fired 13h ago (cooldown elapsed, can re-fire Stage 1)', () => {
    const now = new Date();
    const stage1Time = new Date(now.getTime() - 13 * 60 * 60 * 1000);
    const task = {
      id: '1',
      risk_flag: 'soft_risk' as const,
      status: 'in_progress' as const,
    };
    const taskEvents = [
      {
        event_type: 'escalation_stage_1',
        created_at: stage1Time.toISOString(),
      },
    ];

    const result = determineEscalationStage(task, taskEvents, now);
    expect(result).toBe(1);
  });

  it('returns 2 for Stage 1 fired 25h ago, no Stage 2 (Stage 2 threshold reached)', () => {
    const now = new Date();
    const stage1Time = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const task = {
      id: '1',
      risk_flag: 'soft_risk' as const,
      status: 'in_progress' as const,
    };
    const taskEvents = [
      {
        event_type: 'escalation_stage_1',
        created_at: stage1Time.toISOString(),
      },
    ];

    const result = determineEscalationStage(task, taskEvents, now);
    expect(result).toBe(2);
  });

  it('returns 1 for Stage 1 fired 25h ago, Stage 2 fired 2h ago (Stage 1 can re-fire)', () => {
    const now = new Date();
    const stage1Time = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const stage2Time = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const task = {
      id: '1',
      risk_flag: 'soft_risk' as const,
      status: 'in_progress' as const,
    };
    const taskEvents = [
      {
        event_type: 'escalation_stage_2',
        created_at: stage2Time.toISOString(),
      },
      {
        event_type: 'escalation_stage_1',
        created_at: stage1Time.toISOString(),
      },
    ];

    const result = determineEscalationStage(task, taskEvents, now);
    expect(result).toBe(1);
  });

  it('returns 3 for Stage 1 fired 49h ago, no Stage 3 (Stage 3 threshold reached)', () => {
    const now = new Date();
    const stage1Time = new Date(now.getTime() - 49 * 60 * 60 * 1000);
    const task = {
      id: '1',
      risk_flag: 'soft_risk' as const,
      status: 'in_progress' as const,
    };
    const taskEvents = [
      {
        event_type: 'escalation_stage_1',
        created_at: stage1Time.toISOString(),
      },
    ];

    const result = determineEscalationStage(task, taskEvents, now);
    expect(result).toBe(3);
  });

  it('returns null for task with risk_flag = null', () => {
    const now = new Date();
    const task = {
      id: '1',
      risk_flag: null,
      status: 'in_progress' as const,
    };
    const taskEvents: any[] = [];

    const result = determineEscalationStage(task, taskEvents, now);
    expect(result).toBe(null);
  });

  it('returns null for task with status = completed', () => {
    const now = new Date();
    const task = {
      id: '1',
      risk_flag: 'soft_risk' as const,
      status: 'completed' as const,
    };
    const taskEvents: any[] = [];

    const result = determineEscalationStage(task, taskEvents, now);
    expect(result).toBe(null);
  });
});