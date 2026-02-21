import { supabase } from './supabase';
import { useUserStore } from '../store';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    // Fetch profile and organization data
    const { data: profile } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      useUserStore.getState().setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      });
      
      if (profile.organization) {
        useUserStore.getState().setOrg({
          id: profile.organization.id,
          name: profile.organization.name,
        });
      }
    }
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  useUserStore.getState().clear();
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}
