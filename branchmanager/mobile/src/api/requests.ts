import { supabase } from './supabase';

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  property: string;
  phone: string;
  email: string;
  source: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchRequests(limit: number = 50): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapRequest);
}

export async function searchRequests(query: string): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .or(`client_name.ilike.%${query}%,property.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []).map(mapRequest);
}

function mapRequest(row: any): ServiceRequest {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name || '',
    property: row.property || '',
    phone: row.phone || '',
    email: row.email || '',
    source: row.source || '',
    notes: row.notes || '',
    status: row.status || 'new',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
