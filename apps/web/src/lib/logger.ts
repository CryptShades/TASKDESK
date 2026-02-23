/**
 * Structured logger for Taskdesk server-side code.
 *
 * Production  — emits one JSON line per call to stdout. Compatible with
 *               Vercel log drains, Datadog, Papertrail, and any JSON-aware
 *               aggregator.
 * Development — emits colorized, human-readable output for easy scanning
 *               in a terminal.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('Risk engine start', { org_id: orgId, mode: 'cron' });
 *   logger.error('DB insert failed', { task_id, error: err.message });
 *
 * TODO: Integrate error monitoring service (Sentry recommended).
 * Replace console output with Sentry.captureException for production
 * error tracking. Example:
 *   import * as Sentry from '@sentry/nextjs';
 *   if (level === 'error') Sentry.captureException(context?.error ?? new Error(message));
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

// ANSI color codes — only applied in development
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
} as const;

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: ANSI.gray,
  info: ANSI.green,
  warn: ANSI.yellow,
  error: ANSI.red,
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR',
};

function timestamp(): string {
  return new Date().toISOString();
}

function logProduction(level: LogLevel, message: string, context?: LogContext): void {
  // Single JSON line — every field at the top level for easy filtering
  const entry = {
    level,
    message,
    timestamp: timestamp(),
    ...context,
  };
  // Route errors to stderr so Vercel surfaces them in the error tab;
  // everything else goes to stdout.
  if (level === 'error' || level === 'warn') {
    process.stderr.write(JSON.stringify(entry) + '\n');
  } else {
    process.stdout.write(JSON.stringify(entry) + '\n');
  }
}

function logDevelopment(level: LogLevel, message: string, context?: LogContext): void {
  const color = LEVEL_COLORS[level];
  const label = LEVEL_LABELS[level];
  const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm

  const header = `${ANSI.dim}${ts}${ANSI.reset} ${color}${ANSI.bold}${label}${ANSI.reset} ${message}`;
  console.log(header);

  if (context && Object.keys(context).length > 0) {
    for (const [key, value] of Object.entries(context)) {
      const formattedValue =
        typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : String(value);
      console.log(`  ${ANSI.dim}${key}${ANSI.reset}: ${formattedValue}`);
    }
  }
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'production') {
    logProduction(level, message, context);
  } else {
    logDevelopment(level, message, context);
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    log('debug', message, context);
  },
  info(message: string, context?: LogContext): void {
    log('info', message, context);
  },
  warn(message: string, context?: LogContext): void {
    log('warn', message, context);
  },
  error(message: string, context?: LogContext): void {
    log('error', message, context);
  },
};
