import { supabase } from './supabase';
import type { PayrollRun, PayrollEmployee } from '../models/types';

export async function getPayrollRun(startDate: string, endDate: string): Promise<PayrollRun | null> {
  // In production: fetch from payroll_runs table
  // For now, compute from time_entries
  const { data: entries } = await supabase
    .from('time_entries')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);

  if (!entries?.length) return null;

  const byEmployee: Record<string, { hours: number; name: string }> = {};
  entries.forEach((e: any) => {
    const id = e.user_id || e.user_name || 'unknown';
    if (!byEmployee[id]) byEmployee[id] = { hours: 0, name: e.user_name || id };
    byEmployee[id].hours += parseFloat(e.hours) || 0;
  });

  const employees: PayrollEmployee[] = Object.entries(byEmployee).map(([id, data]) => {
    const regular = Math.min(data.hours, 40);
    const overtime = Math.max(0, data.hours - 40);
    const rate = 0; // Would come from team_members table
    return {
      employeeId: id,
      name: data.name,
      regularHours: regular,
      overtimeHours: overtime,
      ptoHours: 0,
      rate,
      grossPay: (regular * rate) + (overtime * rate * 1.5),
      approved: false,
    };
  });

  return {
    id: `payroll-${startDate}`,
    startDate,
    endDate,
    employees,
    totalRegular: employees.reduce((s, e) => s + e.regularHours, 0),
    totalOvertime: employees.reduce((s, e) => s + e.overtimeHours, 0),
    totalGross: employees.reduce((s, e) => s + e.grossPay, 0),
    status: 'draft',
  };
}

export async function submitPayroll(runId: string): Promise<boolean> {
  // In production: POST to Gusto API
  console.log('[Payroll] Submitting:', runId);
  return true;
}
