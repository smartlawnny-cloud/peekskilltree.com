import type { RoleKey, PermissionKey } from '../models/types';

const DENIED_PERMISSIONS: Partial<Record<RoleKey, PermissionKey[]>> = {
  employee: [
    'timesheets.edit_hours',
    'timesheets.approve_hours',
    'timesheets.delete_hours',
    'payroll.view_summary',
    'payroll.trigger',
    'payroll.view_reports',
    'payroll.fix_errors',
    'payroll.sync_gusto',
    'employees.add',
    'employees.edit_info',
    'employees.change_pay_rates',
    'employees.terminate',
    'employees.assign_roles',
    'system.manage_settings',
    'system.manage_permissions',
    'system.manage_overtime',
    'system.manage_schedules',
    'system.manage_job_codes',
    'system.manage_notifications',
  ],
  crew_member: [
    'timesheets.edit_hours',
    'timesheets.approve_hours',
    'timesheets.delete_hours',
    'payroll.view_summary',
    'payroll.trigger',
    'payroll.view_reports',
    'payroll.fix_errors',
    'payroll.sync_gusto',
    'employees.add',
    'employees.edit_info',
    'employees.change_pay_rates',
    'employees.terminate',
    'employees.assign_roles',
    'system.manage_settings',
    'system.manage_permissions',
    'system.manage_overtime',
    'system.manage_schedules',
    'system.manage_job_codes',
    'system.manage_notifications',
  ],
  crew_lead: [
    'payroll.trigger',
    'payroll.fix_errors',
    'payroll.sync_gusto',
    'employees.add',
    'employees.terminate',
    'employees.change_pay_rates',
    'employees.assign_roles',
    'system.manage_settings',
    'system.manage_permissions',
  ],
  manager: [
    'system.manage_permissions',
    'system.manage_settings',
    'employees.terminate',
    'employees.change_pay_rates',
    'payroll.trigger',
    'payroll.fix_errors',
  ],
};

export function can(role: RoleKey, permission: PermissionKey): boolean {
  if (role === 'super_admin' || role === 'owner') return true;
  const denied = DENIED_PERMISSIONS[role];
  if (!denied) return true;
  return !denied.includes(permission);
}
