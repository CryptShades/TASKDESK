import { describe, it, expect } from 'vitest';
import { shouldSendReminder } from '../workers/reminder-engine';

describe('shouldSendReminder', () => {
  it('returns reminder_24h for task due in 24h, no prior reminder', () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const task = {
      id: '1',
      due_date: dueDate.toISOString(),
      status: 'in_progress' as const,
    };
    const taskEvents: any[] = [];

    const result = shouldSendReminder(task, taskEvents, now);
    expect(result).toBe('reminder_24h');
  });

  it('returns null for task due in 24h, reminder_24h event exists within 22h', () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const reminderTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h ago
    const task = {
      id: '1',
      due_date: dueDate.toISOString(),
      status: 'in_progress' as const,
    };
    const taskEvents = [
      {
        event_type: 'reminder_sent',
        new_value: '24h',
        created_at: reminderTime.toISOString(),
      },
    ];

    const result = shouldSendReminder(task, taskEvents, now);
    expect(result).toBe(null);
  });

  it('returns reminder_due_today for task due today within 7–9am window, no prior due_today reminder', () => {
    const now = new Date();
    now.setUTCHours(8, 0, 0, 0); // 8 AM UTC
    const dueDate = new Date(now);
    dueDate.setUTCHours(12, 0, 0, 0); // Same day, later time
    const task = {
      id: '1',
      due_date: dueDate.toISOString(),
      status: 'in_progress' as const,
    };
    const taskEvents: any[] = [];

    const result = shouldSendReminder(task, taskEvents, now);
    expect(result).toBe('reminder_due_today');
  });

  it('returns overdue for task past due_date, status = in_progress', () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h ago
    const task = {
      id: '1',
      due_date: dueDate.toISOString(),
      status: 'in_progress' as const,
    };
    const taskEvents: any[] = [];

    const result = shouldSendReminder(task, taskEvents, now);
    expect(result).toBe('overdue');
  });

  it('returns null for task past due_date, status = completed', () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h ago
    const task = {
      id: '1',
      due_date: dueDate.toISOString(),
      status: 'completed' as const,
    };
    const taskEvents: any[] = [];

    const result = shouldSendReminder(task, taskEvents, now);
    expect(result).toBe(null);
  });

  it('returns null for task due in 48h', () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const task = {
      id: '1',
      due_date: dueDate.toISOString(),
      status: 'in_progress' as const,
    };
    const taskEvents: any[] = [];

    const result = shouldSendReminder(task, taskEvents, now);
    expect(result).toBe(null);
  });
});