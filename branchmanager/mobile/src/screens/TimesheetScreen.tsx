import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, radius, fontSize } from '../theme';
import { WeekSelector } from '../components/WeekSelector';
import { SummaryCard } from '../components/SummaryCard';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { getWeekDates, dayName, dayOfMonth, isToday, formatDateFull } from '../utils/date';
import { hours as fmtHours } from '../utils/format';
import type { HourEntry, Employee } from '../models/types';

// Demo data
const DEMO_EMPLOYEES: Employee[] = [
  { id: 'owner', name: 'Doug Brown', role: 'owner', payRate: 0, active: true },
  { id: 'cc', name: 'Catherine Conway', role: 'crew_lead', payRate: 35, active: true },
  { id: 'rk', name: 'Ryan Knapp', role: 'crew_member', payRate: 28, active: true },
];

const DEMO_ENTRIES: HourEntry[] = [
  { id: '1', employeeId: 'owner', date: '', clockIn: '', hours: 9, type: 'regular' },
  { id: '2', employeeId: 'cc', date: '', clockIn: '', hours: 8, type: 'regular' },
  { id: '3', employeeId: 'rk', date: '', clockIn: '', hours: 7.5, type: 'regular' },
];

export function TimesheetScreen({ navigation }: any) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  const dates = getWeekDates(weekOffset);
  const weekStart = dates[0];
  const weekEnd = dates[6];
  const employees = DEMO_EMPLOYEES;

  // Build mock entries across the week
  const getEntries = useCallback((empId: string, date: string) => {
    // Demo: random hours for past days
    const d = new Date(date + 'T00:00:00');
    const now = new Date();
    if (d > now || d.getDay() === 0 || d.getDay() === 6) return [];
    const h = empId === 'owner' ? 9 : empId === 'cc' ? 8 : 7.5;
    return [{ id: empId + date, employeeId: empId, date, hours: h, type: 'regular' as const }];
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Calculate week totals
  let totalHours = 0;
  let totalOT = 0;
  let warnings = 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Timesheets</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.greenDark} />}
      >
        <View style={styles.content}>
          <WeekSelector
            weekStart={weekStart}
            weekEnd={weekEnd}
            isCurrent={weekOffset === 0}
            onPrev={() => setWeekOffset(o => o - 1)}
            onNext={() => setWeekOffset(o => o + 1)}
            onToday={() => setWeekOffset(0)}
          />

          {/* Bulk Actions */}
          <View style={styles.bulkRow}>
            <TouchableOpacity style={[styles.bulkBtn, styles.bulkPrimary]}>
              <Text style={styles.bulkPrimaryText}>✓ Approve All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkBtn}>
              <Text style={styles.bulkBtnText}>Summary</Text>
            </TouchableOpacity>
          </View>

          {/* Week Grid */}
          <Card style={styles.gridCard}>
            {/* Day Headers */}
            <View style={styles.gridHeader}>
              <View style={styles.nameColHeader}>
                <Text style={styles.colLabel}>Employee</Text>
              </View>
              {dates.map(date => (
                <View key={date} style={[styles.dayColHeader, isToday(date) && styles.dayColToday]}>
                  <Text style={styles.dayLabel}>{dayName(date)}</Text>
                  <Text style={styles.dayNum}>{dayOfMonth(date)}</Text>
                </View>
              ))}
              <View style={styles.totalColHeader}>
                <Text style={styles.colLabel}>Total</Text>
              </View>
            </View>

            {/* Employee Rows */}
            {employees.map(emp => {
              let empTotal = 0;

              return (
                <View key={emp.id} style={styles.empRow}>
                  {/* Name */}
                  <View style={styles.nameCol}>
                    <Avatar name={emp.name} size={26} />
                    <View style={styles.nameWrap}>
                      <Text style={styles.empName} numberOfLines={1}>{emp.name.split(' ')[0]}</Text>
                      <Text style={styles.empRole}>{emp.role}</Text>
                    </View>
                  </View>

                  {/* Day Cells */}
                  {dates.map(date => {
                    const entries = getEntries(emp.id, date);
                    const dayHours = entries.reduce((s, e) => s + (e.hours || 0), 0);
                    empTotal += dayHours;
                    totalHours += dayHours;
                    const cellKey = emp.id + '_' + date;
                    const barColor = dayHours > 0 ? colors.greenLight : colors.border;

                    return (
                      <TouchableOpacity
                        key={date}
                        style={[styles.dayCell, isToday(date) && styles.dayCellToday]}
                        onPress={() => setExpandedCell(expandedCell === cellKey ? null : cellKey)}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.cellHours, dayHours > 0 ? styles.cellActive : styles.cellEmpty]}>
                          {dayHours > 0 ? dayHours.toFixed(1) : '—'}
                        </Text>
                        <View style={[styles.cellBar, { backgroundColor: barColor }]} />

                        {expandedCell === cellKey && entries.length > 0 && (
                          <View style={styles.cellExpanded}>
                            <TouchableOpacity
                              style={styles.detailBtn}
                              onPress={() => {
                                // Open day detail modal
                              }}
                            >
                              <Text style={styles.detailBtnText}>Details</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {/* Week Total */}
                  {(() => {
                    const overtime = Math.max(0, empTotal - 40);
                    totalOT += overtime;
                    return (
                      <View style={styles.totalCol}>
                        <Text style={styles.totalText}>{fmtHours(empTotal)}</Text>
                        {overtime > 0 && <Text style={styles.otText}>{overtime.toFixed(1)} OT</Text>}
                      </View>
                    );
                  })()}
                </View>
              );
            })}
          </Card>

          {/* Weekly Review */}
          <Card style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Weekly Review</Text>
            <View style={styles.summaryRow}>
              <SummaryCard label="Total Hours" value={totalHours.toFixed(1)} />
              <SummaryCard
                label="Overtime"
                value={totalOT.toFixed(1)}
                color={totalOT > 0 ? '#d97706' : colors.text}
                bgColor={totalOT > 0 ? colors.orangeBg : colors.bg}
              />
              <SummaryCard label="Warnings" value={warnings.toString()} />
              <SummaryCard
                label="Approved"
                value="0/3"
                color="#d97706"
                bgColor={colors.orangeBg}
              />
            </View>

            {/* Payroll readiness */}
            <View style={styles.payrollReady}>
              <Text style={styles.payrollIcon}>⏳</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.payrollTitle}>Payroll Not Ready</Text>
                <Text style={styles.payrollSub}>3 employee(s) pending approval</Text>
              </View>
            </View>
          </Card>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  actionBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
  },
  bulkRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bulkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  bulkPrimary: {
    backgroundColor: colors.greenDark,
    borderColor: colors.greenDark,
  },
  bulkPrimaryText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.white,
  },
  bulkBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  gridCard: {
    padding: 0,
    overflow: 'hidden',
  },
  gridHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  nameColHeader: {
    width: 90,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  dayColHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dayColToday: {
    backgroundColor: colors.greenBg,
  },
  dayLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayNum: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 1,
  },
  totalColHeader: {
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'stretch',
  },
  nameCol: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  nameWrap: {
    flex: 1,
  },
  empName: {
    fontWeight: '600',
    fontSize: fontSize.xs,
  },
  empRole: {
    fontSize: 9,
    color: colors.textLight,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    minHeight: 50,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#f8f8f8',
  },
  dayCellToday: {
    backgroundColor: '#f0fdf4',
  },
  cellHours: {
    fontSize: fontSize.md,
  },
  cellActive: {
    fontWeight: '700',
    color: colors.text,
  },
  cellEmpty: {
    fontWeight: '400',
    color: '#ccc',
  },
  cellBar: {
    height: 4,
    width: '75%',
    borderRadius: 2,
    marginTop: 4,
  },
  cellExpanded: {
    marginTop: 4,
  },
  detailBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  detailBtnText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: '600',
  },
  totalCol: {
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '800',
  },
  otText: {
    fontSize: 9,
    color: colors.red,
    fontWeight: '600',
  },
  reviewCard: {
    marginTop: spacing.lg,
  },
  reviewTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  payrollReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.orangeBg,
    borderWidth: 2,
    borderColor: colors.orange,
  },
  payrollIcon: {
    fontSize: 28,
  },
  payrollTitle: {
    fontWeight: '700',
    fontSize: fontSize.md,
    color: '#92400e',
  },
  payrollSub: {
    fontSize: fontSize.sm,
    color: '#92400e',
    marginTop: 2,
  },
});
