'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser } from '@/services/auth.client';
import { getOrganization } from '@/services/organization.client';
import type { Database } from '../../supabase/types';

type User = Database['public']['Tables']['users']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

interface UserContextType {
  currentUser: User | null;
  organization: Organization | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      setCurrentUser(user);

      const org = await getOrganization(user.org_id);
      setOrganization(org);
    } catch (error) {
      // User is not authenticated, context will remain null
      setCurrentUser(null);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = async () => {
    await fetchData();
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        organization,
        isLoading,
        refetch,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}