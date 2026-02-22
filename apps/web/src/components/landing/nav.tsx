'use client';

import { useState, useEffect } from 'react';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Product', href: '#solution' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(8, 10, 15, 0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-10">
          {/* Wordmark */}
          <div className="flex items-center gap-2.5">
            <span
              className="text-sm font-bold tracking-[-0.01em]"
              style={{ color: '#F0F2F8' }}
            >
              TASKDESK
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.28)',
                color: '#F59E0B',
              }}
            >
              BETA
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm transition-colors duration-200"
                style={{ color: '#8A91A8' }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#F0F2F8'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#8A91A8'; }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <a
            href="#pricing"
            className="hidden items-center rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all duration-200 md:flex"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(59, 130, 246, 0.4)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
          >
            Request Early Access
          </a>

          {/* Mobile hamburger */}
          <button
            className="flex flex-col items-center justify-center gap-[5px] p-2 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <span
              className="block h-px w-5 transition-all duration-200"
              style={{
                background: '#8A91A8',
                transform: mobileOpen ? 'translateY(6px) rotate(45deg)' : 'none',
              }}
            />
            <span
              className="block h-px w-5 transition-all duration-200"
              style={{
                background: '#8A91A8',
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              className="block h-px w-5 transition-all duration-200"
              style={{
                background: '#8A91A8',
                transform: mobileOpen ? 'translateY(-6px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className="fixed inset-0 top-16 z-40 flex flex-col px-6 py-8 md:hidden transition-all duration-300"
        style={{
          background: '#080A0F',
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <nav className="flex flex-col gap-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-lg font-medium"
              style={{ color: '#F0F2F8' }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#pricing"
            onClick={() => setMobileOpen(false)}
            className="mt-4 rounded-lg py-3 text-center text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)' }}
          >
            Request Early Access
          </a>
        </nav>
      </div>
    </>
  );
}
