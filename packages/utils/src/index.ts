import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes without conflicts. Use everywhere instead of raw `clsx`. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format an ISO date string or Date object as "Jan 1, 2025". */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Return a human-readable relative label for a future/past date:
 * "Today", "Tomorrow", "Yesterday", "In N days", "N days ago".
 */
export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  // Normalise to midnight so fractional hours don't affect the day count
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

/** Returns true when the given date is strictly before today (past midnight). */
export function isOverdue(date: string | Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}
