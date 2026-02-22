'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'Is Taskdesk a task manager?',
    a: 'No. Taskdesk is a risk detection layer that sits on top of your campaign execution. You still assign tasks and set deadlines — Taskdesk watches what happens next and tells you when something is about to go wrong.',
  },
  {
    q: 'Can we replace ClickUp or Asana with Taskdesk?',
    a: "Taskdesk is not designed to replace project management tools. It's designed to add risk visibility to any execution workflow. That said, many agencies find Taskdesk's built-in task structure sufficient for campaign-level work and use it as their primary tool.",
  },
  {
    q: 'How does the escalation system work?',
    a: 'When a task becomes overdue or a dependency stalls, Taskdesk notifies the task owner first. If the issue remains unresolved after a configurable threshold, it escalates to the campaign manager, then to the founder. Every escalation is logged with a timestamp and audit trail.',
  },
  {
    q: 'Does it integrate with CRM or ad platforms?',
    a: 'Not in the current version. Taskdesk focuses on campaign execution and internal task risk — not external data pipelines. CRM and platform integrations are on the product roadmap.',
  },
  {
    q: 'Is it suitable for enterprise teams?',
    a: "Taskdesk is purpose-built for 5–15 person agencies. Larger organizations have different needs and different tools. We're focused on this segment and not trying to serve everyone.",
  },
  {
    q: 'How is risk calculated?',
    a: 'Risk scoring is rule-based, not algorithmic. A campaign enters "At Risk" when tasks hit inactivity thresholds or dependencies stall. It enters "High Risk" when tasks are overdue or blocked beyond 24 hours. Logic is transparent and configurable.',
  },
  {
    q: 'Is my client data secure?',
    a: "Yes. Taskdesk uses row-level security at the database level, meaning your company's data is fully isolated. All access events are logged. No data is shared between organizations.",
  },
  {
    q: 'What does onboarding look like?',
    a: 'No onboarding call required. Create your account, add your first campaign, assign tasks with dependencies, and Taskdesk starts monitoring immediately. Most teams are up and running in under 30 minutes.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div
      className="divide-y divide-[#1C2030]"
      style={{ borderTop: '1px solid #1C2030', borderBottom: '1px solid #1C2030' }}
    >
      {faqs.map((faq, i) => (
        <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid #1C2030' : undefined }}>
          <button
            className="flex w-full items-start justify-between py-5 text-left"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            <span
              className="pr-6 text-base font-medium leading-snug transition-colors duration-150"
              style={{ color: openIndex === i ? '#F0F2F8' : '#8A91A8' }}
            >
              {faq.q}
            </span>
            <span
              className="mt-0.5 shrink-0 text-lg leading-none transition-transform duration-200"
              style={{
                color: '#4A5068',
                transform: openIndex === i ? 'rotate(45deg)' : 'none',
              }}
            >
              +
            </span>
          </button>
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: openIndex === i ? '240px' : '0' }}
          >
            <p className="pb-5 text-sm leading-relaxed" style={{ color: '#8A91A8' }}>
              {faq.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
