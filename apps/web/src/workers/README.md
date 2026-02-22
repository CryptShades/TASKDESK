# Background Workers

Background workers for Taskdesk. All workers are idempotent and use the SYSTEM_ACTOR_ID for task events. Workers are invoked by Vercel Cron or event-triggered via task.service.ts.

## Workers

- **Risk Engine** (`runRiskEngine`): Evaluates task and campaign risk levels hourly
- **Reminder Engine** (`runReminderEngine`): Sends task reminders and overdue notifications
- **Escalation Processor** (`processEscalations`): Escalates at-risk tasks to managers/founders

## Pure Functions

For testing purposes, the following pure business logic functions are also exported:

- `evaluateTaskRisk`
- `calculateCampaignRisk`
- `determineEscalationStage`
- `shouldSendReminder`