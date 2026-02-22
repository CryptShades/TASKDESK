'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { useRealtime } from '@/context/realtime-context';
import { signOut } from '@/services/auth/client';
import {
  BarChart3,
  Users,
  Building2,
  Target,
  CheckSquare,
  Bell,
  AlertTriangle,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    roles: ['founder', 'admin', 'manager', 'agent'],
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: Building2,
    roles: ['founder', 'admin', 'manager'],
  },
  {
    name: 'Campaigns',
    href: '/campaigns',
    icon: Target,
    roles: ['founder', 'admin', 'manager'],
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    roles: ['founder', 'admin', 'manager', 'agent'],
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['founder', 'admin', 'manager', 'agent'],
  },
  {
    name: 'Escalations',
    href: '/escalations',
    icon: AlertTriangle,
    roles: ['founder', 'admin', 'manager'],
  },
  {
    name: 'Team',
    href: '/team',
    icon: Users,
    roles: ['founder', 'admin'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['founder', 'admin', 'manager', 'agent'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, organization } = useUser();
  const { isConnected } = useRealtime();
  const [unreadCount, setUnreadCount] = useState(0);
  const [escalationCount, setEscalationCount] = useState(0);

  useEffect(() => {
    const handleNotification = () => setUnreadCount(prev => prev + 1);
    const handleCampaign = (e: any) => {
      const next = e.detail;
      if (next?.risk_status === 'high_risk') {
        setEscalationCount(prev => prev + 1);
      }
    };

    window.addEventListener('notification:new' as any, handleNotification);
    window.addEventListener('campaign:updated' as any, handleCampaign);
    
    return () => {
      window.removeEventListener('notification:new' as any, handleNotification);
      window.removeEventListener('campaign:updated' as any, handleCampaign);
    };
  }, []);

  const filteredItems = navigationItems.filter(item =>
    currentUser?.role && item.roles.includes(currentUser.role)
  );

  async function handleSignOut() {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo and Organization */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center relative">
            <span className="text-white font-bold text-sm">TD</span>
            {!isConnected && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Taskdesk</h1>
            <p className="text-xs text-gray-500">{organization?.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            const hasBadge = (item.name === 'Notifications' && unreadCount > 0) || 
                             (item.name === 'Escalations' && escalationCount > 0);
            const badgeValue = item.name === 'Notifications' ? unreadCount : escalationCount;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {hasBadge && (
                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                      {badgeValue}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar
            name={currentUser?.name || 'User'}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser?.name}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
              {!isConnected && <span className="text-[10px] text-amber-600 font-medium">Offline</span>}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 justify-start text-gray-700 hover:text-gray-900"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}