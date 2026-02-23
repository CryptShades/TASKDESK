# Taskdesk UI System

This document defines the production UI contract for Taskdesk as a founder risk command center.

## 1) Dashboard Layout Structure
- Top layer: `Risk Summary` with three cards in severity order.
  - `High Risk`
  - `At Risk`
  - `Normal`
- Middle layer: `Campaign Risk Table`.
  - Columns: Campaign, Client, Risk, Launch (date + countdown), Pending, Blocked, Action
  - Sorted by severity first, then launch proximity
- Bottom layer: `Urgent Escalations`.
  - Shows hard-risk dependency gaps only
  - Stage 3 strip appears when urgent escalations exist

## 2) Component System Definition
- `MetricCard` (`apps/web/src/components/ui/metric-card.tsx`)
  - Radius: 16px
  - Padding: 20px
  - Border: 1px
  - Shadow: subtle panel shadow token
- `CampaignRiskTable` (`apps/web/src/components/dashboard/campaign-risk-table.tsx`)
  - Calm row highlighting by risk tier
  - No flashing alerts
- `DependencyAlertFeed` (`apps/web/src/components/dashboard/dependency-alert-feed.tsx`)
  - Stage-3 only feed for founder action
- `Button` (`apps/web/src/components/ui/button.tsx`)
  - Primary: indigo solid
  - Secondary: transparent + 1px border
  - Danger: red outline by default, solid red only in confirmation context
- `RiskBadge` (`apps/web/src/components/ui/risk-badge.tsx`)
  - Small pill, uppercase labels, 12px semibold

## 3) Color Token System
- Background: `#0F1115`
- Surface: `#171A21`
- Surface Raised: `#1E222A`
- Border: `#2A2F38`
- Text Primary: `#F5F7FA`
- Text Secondary: `#9CA3AF`
- Primary CTA: `#4F46E5`
- Risk Normal: `#1EB980`
- Risk At Risk: `#F5A623`
- Risk High Risk: `#E5484D`
- Risk Blocked: `#8B5CF6`
- Completed/Low Emphasis: `#6B7280`

Web tokens are in `apps/web/src/app/globals.css`.
Mobile tokens are in `apps/mobile/src/theme/index.ts`.

## 4) Button Styles
- Height: 40px default (`md`)
- Radius: 10px
- Typography: semibold
- Variants:
  - Primary: `bg-primary text-primary-foreground`
  - Secondary: transparent with border
  - Danger: outlined red
  - Confirmation danger: solid red in destructive confirmation forms

## 5) Risk Badge Component
- `HIGH RISK`: red background + white text
- `AT RISK`: amber background + dark text
- `NORMAL`: teal outline only
- `BLOCKED`: purple outline
- No pulse, no blink, no icon dependency for status comprehension

## 6) Mobile Adaptation Layout
- Founder dashboard (`apps/mobile/app/(tabs)/index.tsx`):
  - Compact 3-card summary (`High Risk`, `At Risk`, `Normal`)
  - Campaign list sorted by severity
  - Urgent tasks section for hard-risk escalations
- Notification bell remains top-right in tab header (`apps/mobile/app/(tabs)/_layout.tsx`)
- Navigation depth remains controlled within current tab stack patterns

## 7) Design Rationale (Founder Psychology)
- Calm control: visual hierarchy favors clarity over urgency theatrics.
- Risk-first scanning: highest-risk entities appear first across metrics, rows, and escalation feed.
- Decisive context: each risk signal is paired with actionable navigation (`View`, `Resolve`).
- Low-noise interaction: motion is limited to short fades/slides; no flashing or alarm patterns.
- Cross-platform consistency: web and mobile share the same risk semantics and token values.
