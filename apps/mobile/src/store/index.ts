import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'founder' | 'manager' | 'member';
}

interface Organization {
  id: string;
  name: string;
}

interface UserState {
  user: User | null;
  organization: Organization | null;
  setUser: (user: User | null) => void;
  setOrg: (org: Organization | null) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  organization: null,
  setUser: (user) => set({ user }),
  setOrg: (organization) => set({ organization }),
  clear: () => set({ user: null, organization: null }),
}));

interface NotificationState {
  unread: number;
  increment: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unread: 0,
  increment: () => set((state) => ({ unread: state.unread + 1 })),
  reset: () => set({ unread: 0 }),
}));
