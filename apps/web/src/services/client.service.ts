import { createClient as createSupabaseClient } from '@/lib/supabase/server';

export interface CreateClientData {
  name: string;
}

export class ClientError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ClientError';
  }
}

export async function getClients(orgId: string) {
  const supabase = createSupabaseClient();

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new ClientError('CLIENTS_FETCH_FAILED', 'Failed to fetch clients');
  }

  return clients;
}

export async function createClient(data: CreateClientData, orgId: string) {
  const supabase = createSupabaseClient();

  // Check for name uniqueness within org
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('org_id', orgId)
    .eq('name', data.name)
    .single();

  if (existingClient) {
    throw new ClientError('NAME_EXISTS', 'A client with this name already exists in your organization');
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      org_id: orgId,
      name: data.name,
    })
    .select()
    .single();

  if (error) {
    throw new ClientError('CLIENT_CREATE_FAILED', 'Failed to create client');
  }

  return client;
}