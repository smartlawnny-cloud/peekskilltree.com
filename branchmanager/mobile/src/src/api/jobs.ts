import { supabase } from './supabase';
import type { Job } from '../models/types';

export async function fetchTodayJobs(): Promise<Job[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('scheduled_date', today)
    .order('scheduled_date');
  if (error) throw error;
  return (data || []).map(mapJob);
}

export async function fetchUpcomingJobs(limit: number = 10): Promise<Job[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .gte('scheduled_date', today)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('scheduled_date')
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapJob);
}

export async function fetchJob(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return mapJob(data);
}

function mapJob(row: any): Job {
  return {
    id: row.id,
    jobNumber: row.job_number,
    clientId: row.client_id,
    clientName: row.client_name,
    property: row.property || row.address,
    description: row.description,
    scheduledDate: row.scheduled_date,
    status: row.status,
    total: row.total || 0,
    crew: row.crew || [],
    notes: row.notes,
    photos: row.photos,
  };
}
