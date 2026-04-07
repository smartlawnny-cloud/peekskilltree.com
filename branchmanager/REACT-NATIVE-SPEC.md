# Branch Manager — React Native Mobile App Spec

## Status: NOT STARTED
## Saved: 2026-04-05

## Overview
Full React Native + TypeScript rebuild of Branch Manager mobile app.
Replaces the Capacitor PWA wrapper with a native app.

## Tech Stack
- React Native
- TypeScript
- React Navigation (stack + bottom tabs)
- React Query
- Mobile-first iPhone layout
- Jobber-style navigation + spacing
- Gusto-style payroll clarity

## Project Structure

```
/src
  /components - WeekSelector, EmployeeRow, DayCell, StatusBar, HourEntryCard, NoteCard, PhotoThumbnail, ApprovalBadge, PayrollEmployeeRow, SummaryCard, BottomNav
  /screens - HomeScreen, DashboardScreen, SearchScreen, ScheduleScreen, TimesheetScreen, DayDetailModal, PayrollReviewScreen, PayrollConfirmScreen, EmployeeProfileScreen
  /navigation - AppNavigator, BottomTabs
  /api - employees, timesheets, approvals, payroll, gusto
  /hooks - useEmployees, useTimesheet, usePayroll, useApprovals
  /models - Employee, Timesheet, Payroll, Roles
  /utils - formatters, date, permissions
```

## Data Models
- Employee: id, name, phone, email, payRate, roleIds, defaultSchedule, ptoBalance
- TimesheetDay: id, employeeId, date, hours[], notes[], photos[], status
- HourEntry: id, start, end, totalHours, type (regular/overtime/pto)
- PayrollRun: id, startDate, endDate, employees[], totalEarnings, status
- Role: id, name, inheritsFrom[], permissions[]

## Screens (10 total)
1. HomeScreen - Map bg, clock in, today's visits
2. DashboardScreen - Workflow cards, today's jobs
3. SearchScreen - Tabbed search (clients/requests/quotes)
4. ScheduleScreen - Calendar + jobs per day
5. TimesheetScreen - Week view, employee rows, day cells
6. DayDetailModal - Hours, notes, photos, edit actions
7. PayrollReviewScreen - Gusto-style run payroll step 1
8. PayrollConfirmScreen - Submit payroll step 2
9. EmployeeProfileScreen - Tabs: profile/pay/schedule/history/gusto
10. Bottom tabs: Home | Schedule | Timesheet | Search | More

## RBAC
8 roles, multi-role + inheritance enabled, 25+ permission keys

## API Endpoints
- GET/POST /employees, /timesheets, /approvals, /payroll
- Gusto sync: syncEmployees, syncHours, getStatus, submitPayroll, handleWebhook

## Build Priority
1. Navigation + BottomTabs
2. HomeScreen + DashboardScreen
3. TimesheetScreen + DayDetailModal
4. PayrollReviewScreen + PayrollConfirmScreen
5. EmployeeProfileScreen
6. SearchScreen + ScheduleScreen
7. RBAC + permissions
8. Gusto integration
