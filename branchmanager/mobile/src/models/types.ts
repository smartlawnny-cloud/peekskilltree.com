// ── Employee ──
export type RoleKey =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'manager'
  | 'payroll_admin'
  | 'accountant'
  | 'hr_manager'
  | 'employee'
  | 'crew_lead'
  | 'crew_member';

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  payRate: number;
  role: RoleKey;
  roleIds?: RoleKey[];
  defaultSchedule?: string[];
  ptoBalance?: number;
  active: boolean;
  gustoId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Time Entries ──
export type HourType = 'regular' | 'overtime' | 'pto';

export interface HourEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // ISO
  clockOut?: string; // ISO
  hours: number;
  type: HourType;
  jobId?: string;
  notes?: string;
  photos?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TimesheetDay {
  date: string;
  entries: HourEntry[];
  totalHours: number;
  status: 'pending' | 'approved' | 'needs_reapproval';
  notes: string[];
  photos: string[];
}

// ── Payroll ──
export type PayrollStatus = 'draft' | 'review' | 'approved' | 'submitted' | 'processed';

export interface PayrollEmployee {
  employeeId: string;
  name: string;
  regularHours: number;
  overtimeHours: number;
  ptoHours: number;
  rate: number;
  grossPay: number;
  approved: boolean;
}

export interface PayrollRun {
  id: string;
  startDate: string;
  endDate: string;
  employees: PayrollEmployee[];
  totalRegular: number;
  totalOvertime: number;
  totalGross: number;
  status: PayrollStatus;
  gustoRunId?: string;
  createdAt?: string;
}

// ── Jobs ──
export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'late' | 'cancelled';

export interface Job {
  id: string;
  jobNumber: number;
  clientId: string;
  clientName: string;
  property: string;
  description?: string;
  scheduledDate: string;
  status: JobStatus;
  total: number;
  crew: string[];
  notes?: string;
  photos?: string[];
}

// ── Clients ──
export interface Client {
  id: string;
  name: string;
  company?: string;
  address: string;
  phone?: string;
  email?: string;
  status: 'active' | 'lead' | 'archived';
  tags?: string[];
}

// ── Approvals ──
export interface Approval {
  employeeId: string;
  weekStart: string;
  dayApprovals: Record<string, boolean>;
  weekApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

// ── Permissions ──
export type PermissionKey =
  | 'timesheets.view_hours'
  | 'timesheets.edit_hours'
  | 'timesheets.approve_hours'
  | 'timesheets.delete_hours'
  | 'timesheets.add_notes'
  | 'timesheets.view_notes'
  | 'timesheets.view_photos'
  | 'payroll.view_summary'
  | 'payroll.trigger'
  | 'payroll.view_reports'
  | 'payroll.fix_errors'
  | 'payroll.sync_gusto'
  | 'payroll.view_gusto_status'
  | 'employees.add'
  | 'employees.edit_info'
  | 'employees.change_pay_rates'
  | 'employees.terminate'
  | 'employees.assign_roles'
  | 'employees.view_history'
  | 'system.manage_settings'
  | 'system.manage_notifications'
  | 'system.manage_permissions'
  | 'system.manage_overtime'
  | 'system.manage_schedules'
  | 'system.manage_job_codes';
