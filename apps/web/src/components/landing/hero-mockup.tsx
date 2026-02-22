'use client';

import { useEffect, useState } from 'react';

type RiskLevel = 'hard' | 'soft' | 'normal' | 'stalled';

interface Campaign {
  name: string;
  risk: RiskLevel;
  label: string;
  detail: string;
}

const campaigns: Campaign[] = [
  {
    name: 'Apex Fintech Q1 Rebrand',
    risk: 'hard',
    label: 'HIGH RISK',
    detail: '3 tasks blocked · Last update 26h ago',
  },
  {
    name: 'Momentum Capital PPC',
    risk: 'soft',
    label: 'AT RISK',
    detail: 'Dependency stall detected · 2 tasks overdue',
  },
  {
    name: 'NovaBuild Website Launch',
    risk: 'normal',
    label: 'ON TRACK',
    detail: 'All tasks active · 6 days to deadline',
  },
  {
    name: 'DriftCode SEO Sprint',
    risk: 'stalled',
    label: 'STALLED',
    detail: 'No task activity in 18h',
  },
];

const riskConfig: Record<RiskLevel, { bg: string; border: string; text: string; dot: string; rowBg: string }> = {
  hard: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    text: '#EF4444',
    dot: '#EF4444',
    rowBg: 'rgba(239, 68, 68, 0.04)',
  },
  soft: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.28)',
    text: '#F59E0B',
    dot: '#F59E0B',
    rowBg: 'transparent',
  },
  normal: {
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.25)',
    text: '#22C55E',
    dot: '#22C55E',
    rowBg: 'transparent',
  },
  stalled: {
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.22)',
    text: '#F59E0B',
    dot: '#F59E0B',
    rowBg: 'transparent',
  },
};

export function HeroMockup() {
  const [visibleRows, setVisibleRows] = useState<boolean[]>([false, false, false, false]);
  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    campaigns.forEach((_, i) => {
      setTimeout(() => {
        setVisibleRows((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 600 + i * 130);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setLiveTick((t) => t + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'ACTIVE CAMPAIGNS', value: '12', color: '#3B82F6', borderColor: '#3B82F6' },
    { label: 'AT RISK', value: '4', color: '#F59E0B', borderColor: '#F59E0B' },
    { label: 'HIGH RISK', value: '2', color: '#EF4444', borderColor: '#EF4444' },
    { label: 'TASKS STALLED', value: '7', color: '#4A5068', borderColor: 'transparent' },
  ];

  return (
    <div
      className="relative mx-auto w-full max-w-[860px] overflow-hidden rounded-xl"
      style={{
        background: '#0D1017',
        border: '1px solid #1C2030',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 100px rgba(0,0,0,0.7), 0 0 80px rgba(59, 130, 246, 0.08)',
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ background: '#111520', borderColor: '#1C2030' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#EF4444' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#F59E0B' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#22C55E' }} />
          <span className="ml-2 text-[11px]" style={{ color: '#4A5068' }}>
            taskdesk.app / dashboard
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full animate-live-pulse"
            style={{ background: '#22C55E' }}
          />
          <span className="text-[10px] font-semibold tracking-wide" style={{ color: '#22C55E' }}>
            LIVE
          </span>
        </div>
      </div>

      {/* Dashboard header */}
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: '#1C2030' }}
      >
        <span className="text-sm font-semibold" style={{ color: '#F0F2F8' }}>
          Campaign Overview
        </span>
        <span className="text-xs" style={{ color: '#4A5068' }}>
          Today: Feb 22, 2026
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 border-b" style={{ borderColor: '#1C2030' }}>
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 px-4 py-3"
            style={{
              borderRight: i < 3 ? '1px solid #1C2030' : undefined,
              borderTop: `2px solid ${stat.borderColor}`,
            }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: '#4A5068' }}
            >
              {stat.label}
            </span>
            <span className="font-mono text-xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Campaign rows */}
      <div>
        {campaigns.map((campaign, i) => {
          const config = riskConfig[campaign.risk];
          const isHard = campaign.risk === 'hard';
          return (
            <div
              key={campaign.name}
              className="flex items-center justify-between px-5 py-3 transition-all duration-500"
              style={{
                opacity: visibleRows[i] ? 1 : 0,
                transform: visibleRows[i] ? 'translateY(0)' : 'translateY(10px)',
                background: config.rowBg,
                borderBottom: '1px solid #1C2030',
              }}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${isHard ? 'animate-risk-glow' : ''}`}
                    style={{
                      background: config.bg,
                      border: `1px solid ${config.border}`,
                      color: config.text,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: config.dot }}
                    />
                    {campaign.label}
                  </span>
                  <span className="truncate text-sm font-medium" style={{ color: '#F0F2F8' }}>
                    {campaign.name}
                  </span>
                </div>
                <span className="text-xs" style={{ color: '#4A5068' }}>
                  {campaign.detail}
                </span>
              </div>
              <button
                className="ml-4 shrink-0 rounded px-2.5 py-1 text-[10px] font-semibold transition-all"
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.18)',
                  color: '#3B82F6',
                }}
              >
                View
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom live update ticker */}
      <div
        className="flex items-center gap-2 px-5 py-2.5 transition-all duration-300"
        style={{ background: '#0D1017', borderTop: '1px solid #1C2030' }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full animate-live-pulse"
          style={{ background: '#3B82F6' }}
        />
        <span className="text-[10px]" style={{ color: '#4A5068' }}>
          {liveTick % 2 === 0
            ? 'Risk engine updated · All campaigns monitored'
            : 'Dependency check complete · 2 escalations active'}
        </span>
      </div>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-10"
        style={{ background: 'linear-gradient(to top, #0D1017, transparent)' }}
      />
    </div>
  );
}
