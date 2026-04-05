import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, radius, fontSize } from '../theme';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { StatusBadge } from '../components/StatusBadge';
import { today as getToday, formatDate } from '../utils/date';
import { currency } from '../utils/format';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(getToday());

  // Build a week of dates starting Monday
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  // Demo jobs for selected day
  const jobs = selectedDate === getToday() ? [
    { id: '1', num: 315, client: 'Brian Heermance', address: '7 Lynwood Ct, Cortlandt Manor', desc: 'Pruning - 3 oaks', time: '8:00 AM', crew: ['Doug B.', 'Ryan K.'], status: 'scheduled', total: 1800 },
    { id: '2', num: 316, client: 'Marlene Colangelo', address: '25 Oak Dr, Peekskill', desc: 'Tree removal', time: '1:00 PM', crew: ['Doug B.', 'Catherine C.'], status: 'in_progress', total: 3200 },
  ] : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      {/* Week Strip */}
      <View style={styles.weekStrip}>
        {weekDates.map((date, i) => {
          const d = new Date(date + 'T00:00:00');
          const isSelected = date === selectedDate;
          const isTod = date === getToday();
          return (
            <TouchableOpacity
              key={date}
              style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dayBtnLabel, isSelected && styles.dayBtnLabelSel]}>{DAYS[i]}</Text>
              <Text style={[styles.dayBtnNum, isSelected && styles.dayBtnNumSel]}>{d.getDate()}</Text>
              {isTod && <View style={[styles.todayDot, isSelected && styles.todayDotSel]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>

        {jobs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No jobs scheduled</Text>
          </Card>
        ) : (
          jobs.map(job => (
            <Card key={job.id} style={styles.jobCard}>
              <View style={styles.jobTime}>
                <Text style={styles.timeText}>{job.time}</Text>
              </View>
              <View style={styles.jobBody}>
                <View style={styles.jobTop}>
                  <Text style={styles.jobNum}>#{job.num}</Text>
                  <StatusBadge
                    label={job.status.replace('_', ' ')}
                    variant={job.status === 'in_progress' ? 'warning' : 'info'}
                  />
                </View>
                <Text style={styles.jobClient}>{job.client}</Text>
                <Text style={styles.jobAddr}>{job.address}</Text>
                <Text style={styles.jobDesc}>{job.desc}</Text>
                <View style={styles.crewRow}>
                  {job.crew.map((c, i) => (
                    <View key={i} style={styles.crewChip}>
                      <Text style={styles.crewText}>{c}</Text>
                    </View>
                  ))}
                  <Text style={styles.jobTotal}>{currency(job.total)}</Text>
                </View>
              </View>
            </Card>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '800' },
  weekStrip: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: 4,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  dayBtnSelected: {
    backgroundColor: colors.greenDark,
  },
  dayBtnLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary },
  dayBtnLabelSel: { color: colors.white + '99' },
  dayBtnNum: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: 2 },
  dayBtnNumSel: { color: colors.white },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.greenDark, marginTop: 3 },
  todayDotSel: { backgroundColor: colors.white },
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  dateLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.md },
  emptyCard: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: colors.textLight, fontSize: fontSize.md },
  jobCard: { flexDirection: 'row', marginBottom: spacing.sm, padding: 0, overflow: 'hidden' },
  jobTime: {
    width: 70,
    backgroundColor: colors.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  timeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.greenDark },
  jobBody: { flex: 1, padding: spacing.md },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  jobNum: { fontSize: fontSize.xs, fontWeight: '700', color: colors.accent },
  jobClient: { fontSize: fontSize.md, fontWeight: '700' },
  jobAddr: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  jobDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  crewRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, flexWrap: 'wrap' },
  crewChip: { backgroundColor: colors.greenBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  crewText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.greenDark },
  jobTotal: { marginLeft: 'auto', fontWeight: '700', fontSize: fontSize.sm },
});
