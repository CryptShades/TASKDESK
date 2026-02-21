'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { User, Building, Users } from 'lucide-react';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const { currentUser } = useUser();

  const isFounder = currentUser?.role === 'founder';

  const navItems = [
    {
      label: 'Profile',
      href: '/settings/profile',
      icon: User,
      roles: ['founder', 'manager', 'member'],
    },
    {
      label: 'Organization',
      href: '/settings/organization',
      icon: Building,
      roles: ['founder'],
    },
    {
      label: 'Members',
      href: '/settings/members',
      icon: Users,
      roles: ['founder'],
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(currentUser?.role || 'member')
  );

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-foreground-muted hover:bg-surface-raised hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
